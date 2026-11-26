import type { APIRoute, GetStaticPaths } from "astro";
import { mdPages, pageMarkdown } from "../seo/markdown";
import type { Locale } from "../i18n/locales";

export const getStaticPaths = (() =>
  mdPages().map(({ locale, path, file }) => ({
    params: { mdpath: file.replace(/\.md$/, "") },
    props: { locale, path },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(pageMarkdown(props.locale as Locale, props.path as string), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
