import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const workspaceRoot = process.cwd();
const uiRoot = path.join(workspaceRoot, 'src/shared/ui');
const publicIndexPath = path.join(uiRoot, 'index.ts');
const sourceRoot = path.join(workspaceRoot, 'src');

const internalAllowlist = new Map([
  [
    'internal/resolve-compound-target.tsx',
    'internal compound helper with no public component export',
  ],
]);

const runtimeAdapterAllowlist = new Map([
  [
    'features/edit-architecture-canvas/ui/ArchitectureCardShapeUtil.tsx',
    'tldraw ShapeUtil runtime adapter; it is not a rendered React component',
  ],
]);

function readSource(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function parseSource(filePath) {
  return ts.createSourceFile(
    filePath,
    readSource(filePath),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

function isExported(node) {
  return node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function isComponentName(name) {
  return /^[A-Z]/.test(name);
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text;
  return null;
}

export function storyCoversComponentSource(sourceText, componentName) {
  const sourceFile = ts.createSourceFile(
    'component.stories.tsx',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let covered = false;

  function visit(node) {
    if (covered) return;

    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (ts.isIdentifier(node.tagName) && node.tagName.text === componentName) {
        covered = true;
        return;
      }
    }

    if (
      ts.isPropertyAssignment(node) &&
      propertyName(node.name) === 'component' &&
      ts.isIdentifier(node.initializer) &&
      node.initializer.text === componentName
    ) {
      covered = true;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return covered;
}

function exportedComponentNames(sourceFile) {
  const names = new Set();

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && isExported(statement) && statement.name) {
      if (isComponentName(statement.name.text)) names.add(statement.name.text);
      continue;
    }

    if (ts.isVariableStatement(statement) && isExported(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && isComponentName(declaration.name.text)) {
          names.add(declaration.name.text);
        }
      }
      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause && !statement.isTypeOnly) {
      if (!ts.isNamedExports(statement.exportClause)) continue;
      for (const element of statement.exportClause.elements) {
        if (element.isTypeOnly) continue;
        const exportedName = element.name.text;
        if (isComponentName(exportedName)) names.add(exportedName);
      }
    }
  }

  return [...names];
}

function declaredComponentNames(sourceFile) {
  const names = new Set(exportedComponentNames(sourceFile));

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      if (isComponentName(statement.name.text)) names.add(statement.name.text);
      continue;
    }

    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !isComponentName(declaration.name.text)) continue;
      if (
        declaration.initializer &&
        (ts.isArrowFunction(declaration.initializer) ||
          ts.isFunctionExpression(declaration.initializer))
      ) {
        names.add(declaration.name.text);
      }
    }
  }

  return [...names];
}

function publicModuleNames() {
  const sourceFile = parseSource(publicIndexPath);
  const names = [];

  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const moduleName = statement.moduleSpecifier.text.replace(/^\.\//, '');
    if (moduleName) names.push(moduleName);
  }

  return names;
}

function productionComponentFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...productionComponentFiles(absolutePath));
      continue;
    }

    if (!entry.name.endsWith('.tsx')) continue;
    if (entry.name.endsWith('.stories.tsx') || entry.name.endsWith('.test.tsx')) continue;
    files.push(absolutePath);
  }

  return files;
}

function productUiDirectories() {
  const layerNames = ['entities', 'features', 'widgets', 'pages'];
  const directories = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.name === 'ui') directories.push(absolutePath);
      else visit(absolutePath);
    }
  }

  for (const layerName of layerNames) {
    const layerDirectory = path.join(sourceRoot, layerName);
    if (fs.existsSync(layerDirectory)) visit(layerDirectory);
  }

  return directories;
}

function hasJsxAncestor(node) {
  let parent = node.parent;
  while (parent) {
    if (
      ts.isJsxExpression(parent) ||
      ts.isJsxElement(parent) ||
      ts.isJsxSelfClosingElement(parent) ||
      ts.isJsxFragment(parent)
    ) {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

function inspectComponentFile(filePath, failures, options = {}) {
  const relativePath = path.relative(options.relativeRoot ?? uiRoot, filePath);
  const sourceFile = parseSource(filePath);
  const componentNames = exportedComponentNames(sourceFile);
  const declaredNames = declaredComponentNames(sourceFile);

  if (declaredNames.length > 1) {
    failures.push(
      `${relativePath}: declares more than one component (${declaredNames.join(', ')})`,
    );
  }

  function visit(node) {
    if (
      (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
      /Props$/.test(node.name.text)
    ) {
      failures.push(
        `${relativePath}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: move ${node.name.text} to an adjacent *.types.ts file`,
      );
    }

    if (ts.isConditionalExpression(node) && hasJsxAncestor(node)) {
      failures.push(
        `${relativePath}:${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}: JSX conditional expressions are not allowed`,
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (options.allowlist?.has(relativePath) || internalAllowlist.has(relativePath)) return;
  if (componentNames.length === 0) {
    failures.push(
      `${relativePath}: production TSX must export one component or be explicitly allowlisted`,
    );
  }

  if (!options.requireStory || componentNames.length === 0) return;

  const storySources = fs
    .readdirSync(path.dirname(filePath))
    .filter((name) => name.endsWith('.stories.tsx'))
    .map((name) => readSource(path.join(path.dirname(filePath), name)));

  for (const componentName of componentNames) {
    if (
      !storySources.some((storySource) => storyCoversComponentSource(storySource, componentName))
    ) {
      failures.push(`${relativePath}: ${componentName} has no story in the same ui directory`);
    }
  }
}

function inspectStoryCoverage(moduleName, failures) {
  const moduleDirectory = path.join(uiRoot, moduleName);
  const moduleIndex = path.join(moduleDirectory, 'index.ts');
  const storyPath = path.join(moduleDirectory, `${moduleName}.stories.tsx`);

  if (!fs.existsSync(moduleDirectory) || !fs.statSync(moduleDirectory).isDirectory()) {
    failures.push(`${moduleName}: public UI modules must use a folder with an index.ts`);
    return;
  }
  if (!fs.existsSync(moduleIndex)) {
    failures.push(`${moduleName}: missing public module index.ts`);
    return;
  }
  if (!fs.existsSync(storyPath)) {
    failures.push(`${moduleName}: missing ${moduleName}.stories.tsx`);
    return;
  }

  const moduleComponents = exportedComponentNames(parseSource(moduleIndex));
  const storySource = readSource(storyPath);

  if (moduleComponents.length === 0) {
    failures.push(`${moduleName}: public UI module exports no components`);
  }

  for (const componentName of moduleComponents) {
    if (!storyCoversComponentSource(storySource, componentName)) {
      failures.push(`${moduleName}: ${componentName} is not covered by the family story`);
    }
  }
}

function runStorybookGuard() {
  const failures = [];
  const modules = publicModuleNames();

  for (const moduleName of modules) inspectStoryCoverage(moduleName, failures);
  for (const filePath of productionComponentFiles(uiRoot)) inspectComponentFile(filePath, failures);
  for (const uiDirectory of productUiDirectories()) {
    for (const filePath of productionComponentFiles(uiDirectory)) {
      inspectComponentFile(filePath, failures, {
        allowlist: runtimeAdapterAllowlist,
        relativeRoot: sourceRoot,
        requireStory: true,
      });
    }
  }

  if (failures.length > 0) {
    console.error('Storybook design-system guard failed:\n');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Storybook design-system guard passed: ${modules.length} public UI families and all product UI components are covered.`,
  );
}

if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  runStorybookGuard();
}
