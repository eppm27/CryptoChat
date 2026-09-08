import { Link } from "react-router-dom";
import { Button, Card } from "../components/ui";

const NotFoundPage = () => (
  <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
    <Card className="max-w-lg p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">404 error</p>
      <h1 className="mt-2 text-3xl font-bold text-neutral-900">This page moved off-chain</h1>
      <p className="mt-3 text-neutral-600">The address may be incorrect, or the page may no longer exist.</p>
      <Link to="/"><Button className="mt-6">Return to CryptoChat</Button></Link>
    </Card>
  </main>
);

export default NotFoundPage;
