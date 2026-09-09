import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const detailFields = ['Channel', 'Provider', 'Status', 'Recipient'];

export function DetailsPane() {
  return (
    <aside
      aria-labelledby="details-pane-title"
      className="flex min-h-0 flex-col bg-card/20"
    >
      <div className="flex h-11 shrink-0 items-center border-b border-border px-5">
        <h2
          id="details-pane-title"
          className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground/75"
        >
          inspector
        </h2>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 p-5">
        <div>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground/45">
            message details
          </p>
          <h2 className="mt-2 text-lg font-medium tracking-tight text-foreground">
            Nothing selected
          </h2>
        </div>

        <Card className="rounded-sm border-dashed bg-card/35 shadow-none">
          <CardHeader className="gap-1.5 p-4">
            <CardTitle className="font-mono text-xs font-medium">
              Awaiting selection
            </CardTitle>
            <CardDescription className="text-xs leading-5">
              Select a message from the stream to inspect its delivery metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <dl className="divide-y divide-border border-y border-border">
              {detailFields.map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <dt className="font-mono text-[0.65rem] text-muted-foreground/60">
                    {field}
                  </dt>
                  <dd className="font-mono text-[0.65rem] text-muted-foreground/35">
                    —
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
