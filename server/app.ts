import { Application, isHttpError, Router } from "@oak/oak";
import { z } from "zod";
import type { Database } from "@db/sqlite";
import createInsight from "./operations/create-insight.ts";
import deleteInsight from "./operations/delete-insight.ts";
import listInsights from "./operations/list-insights.ts";
import lookupInsight from "./operations/lookup-insight.ts";

const NewInsight = z.object({
  brand: z.number().int().min(0),
  text: z.string().trim().min(1),
});
const InsightId = z.coerce.number().int().positive().max(
  Number.MAX_SAFE_INTEGER,
);

export const createApp = (db: Database): Application => {
  const router = new Router();

  router.get("/_health", (ctx) => {
    ctx.response.body = "OK";
  });

  router.get("/insights", (ctx) => {
    ctx.response.body = listInsights({ db });
  });

  router.get("/insights/:id", (ctx) => {
    const id = InsightId.parse(ctx.params.id);
    const result = lookupInsight({ db, id });
    ctx.response.status = result ? 200 : 404;
    ctx.response.body = result ?? { error: "Insight not found" };
  });

  router.post("/insights", async (ctx) => {
    const input = NewInsight.parse(await ctx.request.body.json());
    const result = createInsight({ db, ...input });
    ctx.response.status = 201;
    ctx.response.headers.set("Location", `/insights/${result.id}`);
    ctx.response.body = result;
  });

  router.delete("/insights/:id", (ctx) => {
    const id = InsightId.parse(ctx.params.id);
    if (deleteInsight({ db, id })) {
      ctx.response.status = 204;
    } else {
      ctx.response.status = 404;
      ctx.response.body = { error: "Insight not found" };
    }
  });

  const app = new Application();
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      if (
        error instanceof z.ZodError ||
        (isHttpError(error) && error.status === 400)
      ) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Invalid insight data or ID" };
      } else {
        console.error(error);
        ctx.response.status = 500;
        ctx.response.body = { error: "Unable to process request" };
      }
    }
  });
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
};
