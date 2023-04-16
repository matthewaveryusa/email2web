/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const key = request.url
		const val = await env.MY_BUCKET.get(key.split(":\/\/")[1]);
		if (val === null) {
		  return new Response("unknown");
		} else {
			return new Response(await val.text())
		}
	},

	async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
		if (message.to !== "email2web@matthewaveryusa.com") {
		  message.forward(message.to)
		  return;
		}
		const reader = message.raw.getReader()
		const dec = new TextDecoder("utf-8");
		let data = ''
		while (true) {
		  const r = await reader.read()
		  if (r.value) {
			try {
		      data += dec.decode(r.value)
			} catch (e) {
				console.log('no toString()', e)
			}
		  }
		  if(r.done) {
			break;
		  }
		}
		console.log(`key: email2web.matthewaveryusa.com/${message.from}`)
		await env.MY_BUCKET.put(`email2web.matthewaveryusa.com/${message.from}`, data)
		message.forward("email@matthewaveryusa.com")
	  },
};
