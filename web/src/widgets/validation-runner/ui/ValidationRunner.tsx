import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';
import { ValidationAttempts } from './ValidationAttempts';
import { ValidationLiveChecks } from './ValidationLiveChecks';
import { ValidationRunnerHeader } from './ValidationRunnerHeader';
import { ValidationRunnerOutput } from './ValidationRunnerOutput';
import type { ValidationRunnerProps } from './ValidationRunner.types';
import './validation-attempts.css';

export function ValidationRunner(props: ValidationRunnerProps) {
  const [activeTab, setActiveTab] = useState('output');
  const currentAttemptSelected = props.currentAttemptSelected ?? props.selectedAttemptId == null;

  const selectAttempt = (id: number) => {
    props.onSelectAttempt?.(id);
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
          onValidate={props.onValidate}
          running={props.running}
          status={props.status}
          usesCommandKey={props.usesCommandKey}
        />
        <div className="validation-runner-navigation">
          <TabsList aria-label="Test runner views" className="validation-runner-tab-list">
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="attempts">Attempts</TabsTrigger>
          </TabsList>
          {props.onLiveChecksChange && (
            <ValidationLiveChecks
              enabled={props.liveChecks ?? false}
              issueCount={props.liveIssueCount ?? 0}
              onChange={props.onLiveChecksChange}
            />
          )}
          {currentAttemptSelected && (
            <span className="validation-active-attempt">Current attempt</span>
          )}
          {!currentAttemptSelected && props.selectedAttemptId != null && (
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
            currentAttemptSelected={currentAttemptSelected}
            onSelectCurrentAttempt={props.onSelectCurrentAttempt}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
