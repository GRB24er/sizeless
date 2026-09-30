import { PageHero } from "./page-hero";
import { Container } from "./primitives";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Terms, privacy and other legal text: numbered sections with an index beside them. */
export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { title: string; content: string }[];
}) {
  return (
    <>
      <PageHero title={title} intro={intro} />
      <section className="border-t border-line bg-surface py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-12">
          <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24">
              <p className="text-[13px] font-semibold text-ink">On this page</p>
              <ol className="mt-3 space-y-2.5 text-sm">
                {sections.map((s) => (
                  <li key={s.title}>
                    <a href={`#${slug(s.title)}`} className="text-ink-2 transition-colors hover:text-ink">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
          <div className="max-w-[68ch] lg:col-span-8 lg:col-start-5">
            {sections.map((s) => (
              <section key={s.title} id={slug(s.title)} className="scroll-mt-24 border-t border-line py-8 first:border-t-0 first:pt-0">
                <h2 className="text-xl font-semibold text-ink">{s.title}</h2>
                <p className="mt-3 leading-[1.7] text-ink-2">{s.content}</p>
              </section>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
