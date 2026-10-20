import type {
	IDataObject,
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

function toObject(body: unknown): IDataObject {
	if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
		return body as IDataObject;
	}
	if (typeof body === 'string' && body.trim().startsWith('{')) {
		try {
			return JSON.parse(body) as IDataObject;
		} catch {
			return { raw: body };
		}
	}
	return { raw: body === undefined || body === null ? '' : String(body) };
}

/**
 * The Weio API answers every failed call with JSON like {"ok": false, "error": "...", "buy": "..."} and an
 * HTTP status code. Turn that into an n8n error that says what happened and what to do next.
 */
export async function checkWeioResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = response.statusCode;
	const body = toObject(response.body);
	if (status < 400 && body.ok !== false) {
		return items;
	}

	const apiMessage = typeof body.error === 'string' && body.error ? body.error : `HTTP ${status}`;
	const domain = String(this.getNodeParameter('domain', '') ?? '').trim();
	let message: string;
	let description: string;

	switch (status) {
		case 400:
			message = `Weio could not read '${domain}' as a website address`;
			description =
				"Enter a public domain like example.com, or a URL like https://www.example.com/page, in the 'Domain' parameter";
			break;
		case 401:
			if (apiMessage.toLowerCase().startsWith('api key required')) {
				message = 'Get Site Info needs a Weio API key';
				description = `Add a Weio API credential to this node.`;
			} else {
				message = 'Weio did not accept the API key';
				description = `Check the key in the Weio API credential (it starts with wk_)`;
			}
			break;
		case 402:
			message = `Weio API key: ${apiMessage}`;
			description = 'This key has no credits left or has expired.';
			break;
		case 429:
			message = `Weio rate limit reached: ${apiMessage}`;
			description =
				"Wait a minute, or space items out with 'Request Options > Batching'";
			break;
		case 503:
			message = `Weio could not run the check: ${apiMessage}`;
			description = 'Try again in a minute.';
			break;
		default:
			message = `Weio API returned: ${apiMessage}`;
			description = 'Try again later.';
	}

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		message,
		description,
		httpCode: String(status),
		itemIndex: this.getItemIndex(),
	});
}

/** Get Site Info returns up to 16 fields; with 'Simplify' on, keep the 10 most useful ones. */
export async function simplifySiteInfo(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const simplify = this.getNodeParameter('simplify', true) as boolean;
	if (!simplify) {
		return items;
	}
	return items.map((item) => {
		const d = item.json;
		if (d.reachable === false) {
			return {
				...item,
				json: {
					domain: d.domain,
					reachable: false,
					http_status: d.http_status ?? null,
					error: d.error ?? null,
				},
			};
		}
		return {
			...item,
			json: {
				domain: d.domain,
				title: d.title ?? null,
				cms: d.cms ?? null,
				mobile_viewport: d.mobile_viewport ?? null,
				role_emails: d.role_emails ?? [],
				phones: d.phones ?? [],
				social: d.social ?? {},
				contact_page: d.contact_page ?? null,
				certificate_error: d.certificate_error === true,
				credits_remaining: d.credits_remaining ?? null,
			},
		};
	});
}
