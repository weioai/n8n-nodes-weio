import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class WeioApi implements ICredentialType {
	name = 'weioApi';

	displayName = 'Weio API';

	icon: Icon = { light: 'file:../icons/weio.svg', dark: 'file:../icons/weio.dark.svg' };

	documentationUrl = 'https://github.com/weioai/n8n-nodes-weio#readme';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			placeholder: 'e.g. wk_...',
		},
		{
			displayName:
				'Testing this credential runs one HTTPS check on weio.ai, which uses 1 credit from the key',
			name: 'testNotice',
			type: 'notice',
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://weio.ai/api',
			url: '/https-check',
			method: 'GET',
			qs: {
				d: 'weio.ai',
			},
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message:
						'Weio did not accept this API key. Check that it starts with wk_ and was copied in full.',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 429,
					message: 'The key is valid but over its per-minute limit. Try again in a minute.',
				},
			},
		],
	};
}
