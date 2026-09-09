import { LoginForm } from "@/components/LoginForm";
export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <div className="mx-auto max-w-sm py-10"><LoginForm next={next} /></div>;
}
