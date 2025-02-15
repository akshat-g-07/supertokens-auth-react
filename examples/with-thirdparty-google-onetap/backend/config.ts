import ThirdParty, { TypeProvider } from "supertokens-node/recipe/thirdparty";
import Session from "supertokens-node/recipe/session";
import { TypeInput } from "supertokens-node/types";
import Dashboard from "supertokens-node/recipe/dashboard";
import { TypeProviderGetResponse } from "supertokens-node/lib/build/recipe/thirdparty/types";
import axios from "axios";

export function getApiDomain() {
    const apiPort = process.env.REACT_APP_API_PORT || 3001;
    const apiUrl = process.env.REACT_APP_API_URL || `http://localhost:${apiPort}`;
    return apiUrl;
}

export function getWebsiteDomain() {
    const websitePort = process.env.REACT_APP_WEBSITE_PORT || 3000;
    const websiteUrl = process.env.REACT_APP_WEBSITE_URL || `http://localhost:${websitePort}`;
    return websiteUrl;
}

export function GoogleOneTap(config: any): TypeProvider {
    const googleProvider = ThirdParty.Google(config);
    return {
        ...googleProvider,
        get: (
            redirectURI: string | undefined,
            authCodeFromRequest: string | undefined,
            userContext: any
        ): TypeProviderGetResponse => {
            const originalGet = googleProvider.get(redirectURI, authCodeFromRequest, userContext);
            return {
                ...originalGet,
                getProfileInfo: async (authCodeResponse: any, userContext: any) => {
                    return {
                        id: authCodeResponse.sub,
                        email: {
                            id: authCodeResponse.email,
                            isVerified: authCodeResponse.email_verified.toLowerCase() === "true",
                        },
                    };
                },
            };
        },
    };
}

export const SuperTokensConfig: TypeInput = {
    supertokens: {
        // this is the location of the SuperTokens core.
        connectionURI: "https://try.supertokens.com",
    },
    appInfo: {
        appName: "SuperTokens Demo App",
        apiDomain: getApiDomain(),
        websiteDomain: getWebsiteDomain(),
    },
    // recipeList contains all the modules that you want to
    // use from SuperTokens. See the full list here: https://supertokens.com/docs/guides
    recipeList: [
        ThirdParty.init({
            signInAndUpFeature: {
                providers: [
                    // We have provided you with development keys which you can use for testing.
                    // IMPORTANT: Please replace them with your own OAuth keys for production use.
                    GoogleOneTap({
                        clientId: "1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com",
                        clientSecret: "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",
                    }),
                    ThirdParty.Github({
                        clientId: "467101b197249757c71f",
                        clientSecret: "e97051221f4b6426e8fe8d51486396703012f5bd",
                    }),
                    ThirdParty.Apple({
                        clientId: "4398792-io.supertokens.example.service",
                        clientSecret: {
                            keyId: "7M48Y4RYDL",
                            privateKey:
                                "-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\n-----END PRIVATE KEY-----",
                            teamId: "YWQCXGJRJL",
                        },
                    }),
                ],
            },
            override: {
                apis: (oI) => {
                    return {
                        ...oI,
                        signInUpPOST: async (input) => {
                            if (oI.signInUpPOST !== undefined) {
                                if (input.provider.id === "google") {
                                    const authCodeResponse = (
                                        await axios.get("https://oauth2.googleapis.com/tokeninfo", {
                                            params: {
                                                id_token: input.code,
                                            },
                                        })
                                    ).data;
                                    return await oI.signInUpPOST({
                                        ...input,
                                        code: "",
                                        authCodeResponse,
                                    });
                                } else {
                                    return await oI.signInUpPOST(input);
                                }
                            }
                            throw "API not enabled";
                        },
                    };
                },
            },
        }),
        Session.init(),
        Dashboard.init(),
    ],
};
