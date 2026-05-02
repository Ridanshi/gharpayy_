import React from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryState = {
  error?: Error;
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("FlowOps UI error", error, info);
  }

  retry = () => this.setState({ error: undefined, hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
        <div className="w-full max-w-lg rounded-xl border bg-card p-6 text-center shadow-2xl">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">FlowOps recovered safely</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Something unexpected happened in this view. Your session is still intact, and you can retry or return to the command center.
          </p>
          {this.state.error?.message && <p className="mt-4 rounded-lg border bg-background/70 p-3 text-left text-xs text-muted-foreground">{this.state.error.message}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button onClick={this.retry}><RotateCcw className="h-4 w-4" />Try again</Button>
            <Button variant="secondary" onClick={() => { window.location.href = "/"; }}><Home className="h-4 w-4" />Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }
}
