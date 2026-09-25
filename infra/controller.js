import {
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from "infra/errors";
import * as cookie from "cookie";
import session from "models/session.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }
}

function onNoMatchHandler(request, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

async function setSessionCookie(session_token, response) {
  const setCookie = cookie.serialize("session_id", session_token, {
    path: "/",
    maxAge: session.expiration_in_milliseconds / 1000,
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
  });
  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, response, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
    return next();
  }
  injectAnonymousUser(request);
  return next();
}

async function injectAuthenticatedUser(request) {
  const session_token = request.cookies.session_id;
  const session_object = await session.findOneValidByToken(session_token);
  const user_object = await user.findOneById(session_object.user_id);
  request.context = {
    ...request.context,
    user: user_object,
  };
}

function injectAnonymousUser(request) {
  const anonymous_user_object = {
    features: ["read:activation_token", "create:session", "create:user"],
  };
  request.context = {
    ...request.context,
    user: anonymous_user_object,
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, response, next) {
    const user_trying_to_request = request.context.user;
    if (authorization.can(user_trying_to_request, feature)) return next();
    throw new ForbiddenError({
      message: "Você não possui permissão para executar esta ação.",
      action: `Verifique se o seu usuário possui a feature "${feature}`,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};
export default controller;
