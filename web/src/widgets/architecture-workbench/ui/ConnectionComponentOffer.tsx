import { Checkbox } from '@mantine/core';
import { useState } from 'react';
import { Button } from '@/shared/ui';
import type { ConnectionComponentOfferProps } from './ConnectionComponentOffer.types';

export function ConnectionComponentOffer({ sourceLabel, onAnswer }: ConnectionComponentOfferProps) {
  const [remember, setRemember] = useState(false);
  return (
    <div className="connection-component-offer">
      <p>
        Connect <strong>{sourceLabel}</strong> to a new component?
      </p>
      <Checkbox
        size="xs"
        label="Remember my choice"
        checked={remember}
        onChange={(event) => setRemember(event.currentTarget.checked)}
      />
      <div className="connection-component-offer__actions">
        <Button size="xs" variant="ghost" color="gray" onClick={() => onAnswer(false, remember)}>
          Not now
        </Button>
        <Button autoFocus size="xs" onClick={() => onAnswer(true, remember)}>
          Add component
        </Button>
      </div>
    </div>
  );
}
