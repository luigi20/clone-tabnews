import {
  InternalServerError,
  MethodNotAllowedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from "infra/errors";
import * as cookie from "cookie";
import session from "models/session.js";
function onErrorHandler(error, request, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof UnauthorizedError
  ) {
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      return response.status(error.statusCode).json(error);
    }

    if (error instanceof UnauthorizedError) {
      clearSessionCookie(response);
      return response.status(error.statusCode).json(error);
    }
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

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
};
export default controller;
