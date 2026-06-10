type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter = async () => null;

/** Wired up once Clerk is loaded (see App.vue). */
export const setTokenGetter = (next: TokenGetter): void => {
  getter = next;
};

export const getToken = (): Promise<string | null> => getter();
