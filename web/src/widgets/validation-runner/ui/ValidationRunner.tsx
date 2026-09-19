import { ValidationRunnerHeader } from './ValidationRunnerHeader';
import { ValidationRunnerOutput } from './ValidationRunnerOutput';
import type { ValidationRunnerProps } from './ValidationRunner.types';

export function ValidationRunner(props: ValidationRunnerProps) {
  return (
    <section className="panel validation-panel validation-terminal">
      <ValidationRunnerHeader
        lines={props.lines}
        onClear={props.onClear}
        onValidate={props.onValidate}
        running={props.running}
        status={props.status}
        usesCommandKey={props.usesCommandKey}
      />
      <ValidationRunnerOutput error={props.error} lines={props.lines} outputRef={props.outputRef} />
    </section>
  );
}
