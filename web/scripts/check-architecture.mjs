import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const layerRank = new Map([
  ['shared', 0],
  ['entities', 1],
  ['features', 2],
  ['widgets', 3],
  ['pages', 4],
  ['app', 5],
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolutePath);
    return /\.(?:ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [absolutePath] : [];
  });
}

function describeFile(sourceRoot, filePath) {
  const relativePath = path.relative(sourceRoot, filePath);
  const segments = relativePath.split(path.sep);
  const layer = layerRank.has(segments[0]) ? segments[0] : null;
  if (!layer) return { layer: null, slice: null, segments, relativePath };
  const slice = layer === 'app' ? 'app' : (segments[1] ?? null);
  return { layer, slice, segments, relativePath };
}

function resolveImport(sourceRoot, sourcePath, specifier) {
  const candidate = specifier.startsWith('@/')
    ? path.join(sourceRoot, specifier.slice(2))
    : path.resolve(path.dirname(sourcePath), specifier);
  const candidates = [
    candidate,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    path.join(candidate, 'index.ts'),
    path.join(candidate, 'index.tsx'),
  ];
  return candidates.find((filePath) => fs.existsSync(filePath) && fs.statSync(filePath).isFile());
}

function isPublicSliceImport(sourceRoot, source, target, resolvedPath) {
  if (!source.layer || !target.layer) return true;
  if (source.layer === 'shared' && target.layer === 'shared') return true;
  if (source.layer === target.layer && source.slice === target.slice) return true;

  if (target.layer === 'shared' && target.segments.length === 3) return true;

  const publicDepth = target.layer === 'app' ? 1 : 2;
  const targetDirectory = path.join(sourceRoot, ...target.segments.slice(0, publicDepth));
  return (
    resolvedPath === path.join(targetDirectory, 'index.ts') ||
    resolvedPath === path.join(targetDirectory, 'index.tsx')
  );
}

function collectModuleSpecifiers(sourceFile) {
  const specifiers = [];
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

export function findArchitectureBoundaryViolations(root = path.resolve('src')) {
  const sourceRoot = path.resolve(root);
  const violations = [];

  for (const filePath of walk(sourceRoot)) {
    const source = describeFile(sourceRoot, filePath);
    if (!source.layer) continue;

    const sourceText = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    for (const specifier of collectModuleSpecifiers(sourceFile)) {
      if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue;

      const resolvedPath = resolveImport(sourceRoot, filePath, specifier);
      if (!resolvedPath) continue;
      const relativeTargetPath = path.relative(sourceRoot, resolvedPath);
      if (relativeTargetPath.startsWith('..') || path.isAbsolute(relativeTargetPath)) continue;
      const target = describeFile(sourceRoot, resolvedPath);
      if (!target.layer) continue;

      if (layerRank.get(target.layer) > layerRank.get(source.layer)) {
        violations.push(
          `${source.relativePath}: ${source.layer} cannot import upward from ${target.layer} (${specifier})`,
        );
        continue;
      }

      if (
        source.layer !== 'shared' &&
        source.layer === target.layer &&
        source.slice !== target.slice
      ) {
        violations.push(
          `${source.relativePath}: slices in ${source.layer} cannot import each other (${specifier})`,
        );
        continue;
      }

      if (!isPublicSliceImport(sourceRoot, source, target, resolvedPath)) {
        violations.push(
          `${source.relativePath}: import ${target.layer}/${target.slice} through its public index (${specifier})`,
        );
      }
    }
  }

  return violations;
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const violations = findArchitectureBoundaryViolations();
  if (violations.length) {
    console.error('Architecture boundary violations:\n');
    for (const violation of violations) console.error(`- ${violation}`);
    process.exitCode = 1;
  } else {
    console.log('Architecture boundaries are valid.');
  }
}
