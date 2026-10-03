import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { websiteDescription } from './resources/website';

export class Weio implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Weio',
		name: 'weio',
		icon: { light: 'file:../../icons/weio.svg', dark: 'file:../../icons/weio.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] === "getSiteInfo" ? "Get Site Info" : "Check HTTPS" }}',
		description:
			'Check website HTTPS certificates and read public business contact facts with the Weio API',
		defaults: {
			name: 'Weio',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		// Optional: Check HTTPS runs on the free tier without a key. Get Site Info needs one.
		credentials: [{ name: 'weioApi', required: false }],
		requestDefaults: {
			baseURL: 'https://weio.ai/api',
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Website',
						value: 'website',
					},
				],
				default: 'website',
			},
			...websiteDescription,
		],
	};
}
