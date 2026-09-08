import React from "react";
import { Button, Card } from "./ui";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unexpected application error", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <Card className="max-w-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">CryptoChat hit an unexpected error</h1>
          <p className="mt-3 text-neutral-600">Refresh the page to try again. If the problem continues, return to the demo from the sign-in page.</p>
          <Button className="mt-6" onClick={() => window.location.assign("/")}>Return home</Button>
        </Card>
      </main>
    );
  }
}

export default ErrorBoundary;
