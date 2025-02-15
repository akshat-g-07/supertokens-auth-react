import React, { useState } from "react";
import "./App.css";
import SuperTokens, { SuperTokensWrapper } from "supertokens-auth-react";
import { getSuperTokensRoutesForReactRouterDom } from "supertokens-auth-react/ui";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Passwordless, { PasswordlessComponentsOverrideProvider } from "supertokens-auth-react/recipe/passwordless";
import { PasswordlessPreBuiltUI } from "supertokens-auth-react/recipe/passwordless/prebuiltui";
import { EmailPasswordPreBuiltUI } from "supertokens-auth-react/recipe/emailpassword/prebuiltui";
import Session, { SessionAuth } from "supertokens-auth-react/recipe/session";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import * as reactRouterDom from "react-router-dom";
import Home from "./Home";
import Footer from "./Footer";
import SessionExpiredPopup from "./SessionExpiredPopup";
import PhoneVerification from "./PhoneVerification";
import PhoneNumberVerificationFooter from "./PhoneVerification/Footer";
import { PhoneVerifiedClaim } from "./phoneVerifiedClaim";

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

SuperTokens.init({
    appInfo: {
        // learn more about this on https://supertokens.com/docs/emailpassword/appinfo
        appName: "SuperTokens Demo App",
        apiDomain: getApiDomain(),
        websiteDomain: getWebsiteDomain(),
        apiBasePath: "/auth",
        websiteBasePath: "/auth",
    },
    languageTranslations: {
        translations: {
            en: {
                EMAIL_PASSWORD_RESET_HEADER_SUBTITLE: "We will send you an SMS to reset your password",
                EMAIL_PASSWORD_EMAIL_LABEL: "Phone number",
                EMAIL_PASSWORD_RESET_SEND_BTN: "Send SMS",
                EMAIL_PASSWORD_RESET_SEND_SUCCESS: "Please check your SMS for the password recovery link. ",
                EMAIL_PASSWORD_SIGN_IN_WRONG_CREDENTIALS_ERROR: "Incorrect phone and password combination",
                EMAIL_PASSWORD_EMAIL_ALREADY_EXISTS: "This phone number already exists. Please sign in instead.",
                "This email already exists. Please sign in instead.":
                    "This phone number already exists. Please sign in instead",
            },
        },
    },
    recipeList: [
        Passwordless.init({
            contactMethod: "PHONE",
            signInUpFeature: {
                // this will not show the passwordless UI unless we render it ourselves.
                disableDefaultUI: true,
            },
        }),
        EmailPassword.init({
            getRedirectionURL: async (context) => {
                if (context.action === "SUCCESS") {
                    // this means that the first login challenge is done. Now we should
                    // redirect the user to the second login challenge
                    return "/auth/verify-phone";
                }
                return undefined;
            },
            signInAndUpFeature: {
                signUpForm: {
                    formFields: [
                        {
                            id: "email",
                            label: "Phone number",
                            placeholder: "Phone number",
                            validate: async (value) => {
                                // We can provide validation logic here.. but the backend
                                // checks for a valid phone number anyway
                                return undefined;
                            },
                        },
                    ],
                },
            },
        }),
        Session.init({
            override: {
                functions: (oI) => ({
                    ...oI,
                    getGlobalClaimValidators: ({ claimValidatorsAddedByOtherRecipes }) => {
                        return [...claimValidatorsAddedByOtherRecipes, PhoneVerifiedClaim.validators.isTrue()];
                    },
                }),
            },
        }),
    ],
});

function App() {
    let [showSessionExpiredPopup, updateShowSessionExpiredPopup] = useState(false);
    let location = useLocation();

    /**
     * We give a key to SuperTokensWrapper such that it causes a recalculation of
     * the session context whenever the pathname changes in the way described below.
     *
     * This is needed because we have provided an override for doesSessionExist in which
     * the logic depends on location.pathname.
     */
    let key = location.pathname;

    return (
        <SuperTokensWrapper key={key}>
            <PasswordlessComponentsOverrideProvider
                components={{
                    PasswordlessUserInputCodeFormFooter_Override: ({ ...props }) => {
                        return <PhoneNumberVerificationFooter recipeImplementation={props.recipeImplementation} />;
                    },
                }}>
                <div className="App">
                    <div className="fill">
                        <Routes>
                            <Route
                                path="/auth/verify-phone"
                                element={
                                    <SessionAuth>
                                        <PhoneVerification />
                                    </SessionAuth>
                                }
                            />
                            {/* This shows the login UI on "/auth" route */}
                            {getSuperTokensRoutesForReactRouterDom(reactRouterDom, [
                                PasswordlessPreBuiltUI,
                                EmailPasswordPreBuiltUI,
                            ])}
                            <Route
                                path="/"
                                element={
                                    /* This protects the "/" route so that it shows
                                <Home /> only if the user is logged in.
                                Else it redirects the user to "/auth" */
                                    <SessionAuth
                                        onSessionExpired={() => {
                                            updateShowSessionExpiredPopup(true);
                                        }}>
                                        <Home />
                                        {showSessionExpiredPopup && <SessionExpiredPopup />}
                                    </SessionAuth>
                                }
                            />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </PasswordlessComponentsOverrideProvider>
        </SuperTokensWrapper>
    );
}

export default function AppWithRouter() {
    return (
        <Router>
            <App />
        </Router>
    );
}
