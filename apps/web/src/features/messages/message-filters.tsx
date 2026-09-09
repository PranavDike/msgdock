import type {
  Channel,
  ListMessagesQuery,
  MessageStatus,
} from '@msgdock/contracts';

import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { channelOptions, statusOptions } from './message-options';

interface MessageFiltersProps {
  channel: Channel | 'all';
  status: MessageStatus | 'all';
  provider: string;
  onChange: (query: ListMessagesQuery) => void;
  onReset: () => void;
}

export function MessageFilters({
  channel,
  status,
  provider,
  onChange,
  onReset,
}: MessageFiltersProps) {
  const hasFilters =
    channel !== 'all' || status !== 'all' || provider.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-2.5 md:px-7">
      <span className="mr-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground/50">
        filter
      </span>
      <Select
        value={channel}
        onValueChange={(value) =>
          onChange({ channel: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger
          aria-label="Channel"
          size="sm"
          className="min-w-28 font-mono text-[0.68rem]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {channelOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={status}
        onValueChange={(value) =>
          onChange({ status: value === 'all' ? undefined : value })
        }
      >
        <SelectTrigger
          aria-label="Status"
          size="sm"
          className="min-w-28 font-mono text-[0.68rem]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        aria-label="Provider"
        className="h-7 w-32 rounded-md px-2.5 font-mono text-[0.68rem]"
        placeholder="all providers"
        value={provider}
        onChange={(event) =>
          onChange({ provider: event.target.value || undefined })
        }
      />
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-7 gap-1.5 px-2 font-mono text-[0.62rem] text-muted-foreground"
          onClick={onReset}
        >
          <RotateCcw aria-hidden="true" className="size-3" />
          reset
        </Button>
      ) : null}
    </div>
  );
}
