import type { INodeProperties } from 'n8n-workflow';
import { checkWeioResponse, simplifySiteInfo } from '../../shared/postReceive';

const showOnlyForWebsite = {
	resource: ['website'],
};

export const websiteDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForWebsite,
		},
		options: [
			{
				name: 'Check HTTPS',
				value: 'checkHttps',
				action: 'Check HTTPS of website',
				description:
					'Check whether a website and its www address load securely, and why a browser shows a warning if not',
				routing: {
					request: {
						method: 'GET',
						url: '/https-check',
						ignoreHttpStatusErrors: true,
					},
					output: {
						postReceive: [checkWeioResponse],
					},
				},
			},
			{
				name: 'Get Site Info',
				value: 'getSiteInfo',
				action: 'Get public business info from website',
				description:
					'Read the public facts a business website shows: title, CMS, mobile layout, role contact emails, phones, social links and contact page',
				routing: {
					request: {
						method: 'GET',
						url: '/site-info',
						ignoreHttpStatusErrors: true,
					},
					output: {
						postReceive: [checkWeioResponse, simplifySiteInfo],
					},
				},
			},
		],
		default: 'checkHttps',
	},
	{
		displayName:
			'Works without a credential on the free tier (a few checks per minute and 20 per day per IP address). With a Weio API credential each check uses 1 credit.',
		name: 'freeTierNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: { ...showOnlyForWebsite, operation: ['checkHttps'] },
		},
	},
	{
		displayName:
			'Needs a Weio API credential. Each call uses 1 credit ($9 for 1,000 calls at weio.ai/services/site-check-api.html).',
		name: 'keyRequiredNotice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: { ...showOnlyForWebsite, operation: ['getSiteInfo'] },
		},
	},
	{
		displayName: 'Domain',
		name: 'domain',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. example.com',
		description:
			'The website to look up, as a domain (example.com) or a full URL (https://www.example.com/page). Only public websites are checked.',
		displayOptions: {
			show: showOnlyForWebsite,
		},
		routing: {
			send: {
				type: 'query',
				property: 'd',
				value: '={{ String($value).trim() }}',
			},
		},
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to return a simplified version of the response instead of the raw data',
		displayOptions: {
			show: { ...showOnlyForWebsite, operation: ['getSiteInfo'] },
		},
	},
];
