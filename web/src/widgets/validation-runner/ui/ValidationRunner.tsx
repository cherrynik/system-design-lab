import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';
import { ValidationAttempts } from './ValidationAttempts';
import { ValidationRunnerHeader } from './ValidationRunnerHeader';
import { ValidationRunnerOutput } from './ValidationRunnerOutput';
import type { ValidationRunnerProps } from './ValidationRunner.types';
import './validation-attempts.css';

export function ValidationRunner(props: ValidationRunnerProps) {
  const [activeTab, setActiveTab] = useState('output');
  const [lastAttemptId, setLastAttemptId] = useState(props.selectedAttemptId);

  if (lastAttemptId !== props.selectedAttemptId) {
    setLastAttemptId(props.selectedAttemptId);
    if (props.running && props.status === 'running') setActiveTab('output');
  }

  const validate = () => {
    setActiveTab('output');
    props.onValidate();
  };

  const selectAttempt = (id: number) => {
    props.onSelectAttempt?.(id);
    setActiveTab('output');
  };

  return (
    <section
      className="panel validation-panel validation-terminal validation-terminal--attempts"
      onCopy={(event) => event.stopPropagation()}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="validation-runner-tabs">
        <ValidationRunnerHeader
          lines={props.lines}
          onClear={props.onClear}
          onValidate={validate}
          running={props.running}
          status={props.status}
          usesCommandKey={props.usesCommandKey}
        />
        <div className="validation-runner-navigation">
          <TabsList aria-label="Test runner views" className="validation-runner-tab-list">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="attempts">Attempts</TabsTrigger>
          </TabsList>
          {props.selectedAttemptId != null && (
            <span className="validation-active-attempt">Attempt #{props.selectedAttemptId}</span>
          )}
        </div>
        <TabsContent value="output" className="validation-runner-content">
          <ValidationRunnerOutput
            error={props.error}
            lines={props.lines}
            outputRef={props.outputRef}
          />
        </TabsContent>
        <TabsContent value="attempts" className="validation-runner-content">
          <ValidationAttempts
            attempts={props.attempts ?? []}
            selectedAttemptId={props.selectedAttemptId}
            onSelectAttempt={selectAttempt}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
