import {
  chat_agent_group_stocks,
  chat_agent_group_options,
  chat_agent_group_investors,
  chat_agent_group_others,
  chat_history_today,
  chat_history_yesterday,
  chat_history_previous_7_days,
  chat_history_previous_30_days,
  chat_history_older,
} from "$lib/paraglide/messages";

// Display labels for values that stay English in the data layer: agentCategory is compared
// against agentOptions[].group, and getDateGroup's return value keys groupedChats.
// ponytail: static switches, not lookup maps — computed message access is a build error.

export function agentCategoryLabel(group: string): string {
  switch (group) {
    case "Stocks":
      return chat_agent_group_stocks();
    case "Options":
      return chat_agent_group_options();
    case "Investors":
      return chat_agent_group_investors();
    default:
      return chat_agent_group_others();
  }
}

export function dateGroupLabel(group: string): string {
  switch (group) {
    case "Today":
      return chat_history_today();
    case "Yesterday":
      return chat_history_yesterday();
    case "Previous 7 Days":
      return chat_history_previous_7_days();
    case "Previous 30 Days":
      return chat_history_previous_30_days();
    default:
      return chat_history_older();
  }
}
