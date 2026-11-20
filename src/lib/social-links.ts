import { z } from "zod";

export const socialLinkSchema = z.object({
  platform: z.enum(["facebook", "instagram", "x", "other"]),
  label: z.string().trim().min(1).max(40),
  url: z.string().trim().max(500).transform(value => value.startsWith("https://") ? value : `https://${value}`).refine(value => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password && /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(url.hostname) && !/\s/.test(value);
    } catch { return false; }
  }),
}).refine(link => {
  const host = new URL(link.url).hostname.replace(/^www\./, "");
  if (link.platform === "other") return true;
  const hosts = link.platform === "facebook" ? ["facebook.com"] : link.platform === "instagram" ? ["instagram.com"] : ["x.com", "twitter.com"];
  return hosts.includes(host) && new URL(link.url).pathname !== "/";
});
export const socialLinksSchema = z.array(socialLinkSchema).max(10);
export type SocialLink = z.infer<typeof socialLinkSchema>;