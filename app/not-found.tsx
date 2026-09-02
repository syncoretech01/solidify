import Link from "next/link";
import { Section } from "@/components/ui/Primitives";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Section surface="deep" className="flex min-h-[70svh] items-center pt-[calc(var(--nav-h)+2rem)]">
      <div className="shell flex flex-col gap-6">
        <span className="eyebrow">404</span>
        <h1 className="display-lg max-w-[14ch]">That page isn&apos;t on the route.</h1>
        <p className="lead measure">The address may have changed. Head back to the homepage or get a vehicle shipping quote.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button href="/">Back to homepage</Button>
          <Button href="/contact" variant="ghost">
            Get a quote
          </Button>
        </div>
        <Link href="/car-shipping" className="link-underline small w-fit">
          Car shipping
        </Link>
      </div>
    </Section>
  );
}
