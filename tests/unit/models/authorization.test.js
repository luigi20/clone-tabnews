import { InternalServerError } from "infra/errors";
import authorization from "models/authorization.js";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const create_user = {
        username: "UserWhithoutFeatures",
      };
      expect(() => {
        authorization.can(create_user);
      }).toThrow(InternalServerError);
    });

    test("with unknown `user.features`", () => {
      const create_user = {
        features: [],
      };
      expect(() => {
        authorization.can(create_user, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and known `feature`", () => {
      const create_user = {
        features: ["create:user"],
      };
      expect(authorization.can(create_user, "create:user")).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const create_user = {
        username: "UserWhithoutFeatures",
      };
      expect(() => {
        authorization.filterOutput(create_user);
      }).toThrow(InternalServerError);
    });

    test("with valid `user`,known `feature` but no `resource`", () => {
      const create_user = {
        features: ["read:user"],
      };
      expect(() => {
        authorization.filterOutput(create_user, "read:user");
      }).toThrow(InternalServerError);
    });

    test("with unknown `user.features`", () => {
      const create_user = {
        features: [],
      };
      expect(() => {
        authorization.filterOutput(create_user, "unknown:feature");
      }).toThrow(InternalServerError);
    });

    test("with valid `user`,`resource` and known `feature`", () => {
      const create_user = {
        features: ["read:user"],
      };
      const resource = {
        id: 1,
        username: "resource",
        features: ["read:user"],
        email: "resource@tab.com.br",
        password: "22434343",
        created_at: "2026-01-01T00:00:000Z",
        updated_at: "2026-01-01T00:00:000Z",
      };
      const result = authorization.filterOutput(
        create_user,
        "read:user",
        resource,
      );
      expect(result).toEqual({
        id: 1,
        username: "resource",
        features: ["read:user"],
        created_at: "2026-01-01T00:00:000Z",
        updated_at: "2026-01-01T00:00:000Z",
      });
    });
  });
});
