export enum HandlePreAction {
  team = 'team',
  ok = 'ok'
};

export enum HandleSpyElectionAction {
  master = 'master',
  start = 'start'
}

export enum HandleGameAction {
  hover = 'hover',
  select = 'select',
  pass = 'pass'
};

export enum HandleSpyAction {
  tell = 'tell'
};

export type HandleAction = HandlePreAction | HandleSpyElectionAction | HandleGameAction | HandleSpyAction;

const PRE_ACTIONS = Object.values(HandlePreAction);
const SPY_ELECTION_ACTIONS = Object.values(HandleSpyElectionAction);
const GAME_ACTIONS = Object.values(HandleGameAction);
const SPY_ACTIONS = Object.values(HandleSpyAction);

export const isPreAction = (a: HandleAction) : a is HandlePreAction => PRE_ACTIONS.includes(a as any);
export const isSpyElectionAction = (a: HandleAction) : a is HandleSpyElectionAction => SPY_ELECTION_ACTIONS.includes(a as any);
export const isGameAction = (a: HandleAction) : a is HandleGameAction => GAME_ACTIONS.includes(a as any);
export const isSpyAction = (a: HandleAction) : a is HandleSpyAction => SPY_ACTIONS.includes(a as any);
