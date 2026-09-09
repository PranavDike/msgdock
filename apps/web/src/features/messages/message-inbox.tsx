import { useEffect, useMemo, useState } from 'react';

import type {
  Channel,
  ListMessagesQuery,
  MessageStatus,
  MessagesApi,
} from '@msgdock/contracts';

import { DetailsPane } from '@/components/details-pane';
import { MessagePane } from '@/components/message-pane';
import type { WorkspaceSection } from '@/components/navigation';
import { useMessage, useMessages } from './use-message-data';

interface MessageInboxProps {
  activeSection: WorkspaceSection;
  api: MessagesApi;
}

function channelForSection(section: WorkspaceSection): Channel | 'all' {
  if (section === 'Email' || section === 'SMS')
    return section.toLowerCase() as Channel;
  return 'all';
}

export function MessageInbox({ activeSection, api }: MessageInboxProps) {
  const [channel, setChannel] = useState<Channel | 'all'>(() =>
    channelForSection(activeSection),
  );
  const [status, setStatus] = useState<MessageStatus | 'all'>('all');
  const [provider, setProvider] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setChannel(channelForSection(activeSection));
  }, [activeSection]);

  const query = useMemo<ListMessagesQuery>(() => {
    const nextQuery: ListMessagesQuery = {};
    if (channel !== 'all') nextQuery.channel = channel;
    if (status !== 'all') nextQuery.status = status;
    if (provider) nextQuery.provider = provider;
    return nextQuery;
  }, [channel, provider, status]);

  const messagesState = useMessages(api, query);
  const selectedState = useMessage(api, selectedId);

  function updateFilters(nextQuery: ListMessagesQuery) {
    if ('channel' in nextQuery) setChannel(nextQuery.channel ?? 'all');
    if ('status' in nextQuery) setStatus(nextQuery.status ?? 'all');
    if ('provider' in nextQuery) setProvider(nextQuery.provider ?? '');
  }

  function resetFilters() {
    setChannel(channelForSection(activeSection));
    setStatus('all');
    setProvider('');
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <MessagePane
        messages={messagesState.data}
        isLoading={messagesState.isLoading}
        error={messagesState.error}
        selectedId={selectedId}
        channel={channel}
        status={status}
        provider={provider}
        onFilterChange={updateFilters}
        onResetFilters={resetFilters}
        onSelect={setSelectedId}
      />
      <DetailsPane
        message={selectedState.data}
        isLoading={selectedState.isLoading}
        error={selectedState.error}
      />
    </div>
  );
}
