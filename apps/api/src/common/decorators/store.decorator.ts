import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UserDontHaveStore } from "../../modules/stores/exceptions/UserDontHaveStore.js";

export const Store = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    if(!request.store) throw new UserDontHaveStore()
    return request.store;
  }
)