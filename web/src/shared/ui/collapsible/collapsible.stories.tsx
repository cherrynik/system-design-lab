import { Paper, Stack, Text } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronDown } from 'lucide-react';
import { Collapsible } from './Collapsible';
import { CollapsibleContent } from './CollapsibleContent';
import { CollapsibleTrigger } from './CollapsibleTrigger';

const meta = {
  title: 'Composition/Collapsible',
  component: Collapsible,
  subcomponents: { CollapsibleTrigger, CollapsibleContent },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RequirementSection: Story = {
  render: () => (
    <Paper withBorder p="sm" w={360}>
      <Collapsible defaultOpen>
        <CollapsibleTrigger
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text fw={600} size="sm">
            Requirements
          </Text>
          <ChevronDown size={14} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Stack gap={4} pt="sm">
            <Text size="sm">Route web traffic to an HTTP API.</Text>
            <Text c="dimmed" size="xs">
              GET /:shortCode over HTTPS
            </Text>
          </Stack>
        </CollapsibleContent>
      </Collapsible>
    </Paper>
  ),
};
