import Link from "next/link";

export default function NotFound() {
  return (
    <section className="jumbotron mx-auto mt-6 max-w-xl px-6 py-12 text-center">
      <p className="led text-6xl">404</p>
      <h1 className="mt-2 font-display text-3xl">Icing!</h1>
      <p className="mt-3 text-white/70">That page shot the length of the ice and nobody touched it.</p>
      <Link href="/" className="mt-6 inline-block font-bold text-led underline">
        Back to center ice
      </Link>
    </section>
  );
}
