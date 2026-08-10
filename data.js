/* ==========================================================
   QUESTION BANK
   ----------------------------------------------------------
   TO ADD A NEW CATEGORY: just add a new key with an array
   of strings, e.g.  travel: ["...", "..."]
   TO ADD MORE QUESTIONS: push more strings into an existing
   category array. That's it — the app auto-detects them.
   ========================================================== */

const QUESTION_BANK = {
  truth: {
    funny: [
      "What's the weirdest dream you've ever had?",
      "What's the most embarrassing song on your playlist?",
      "What's a silly thing you're irrationally afraid of?",
      "What's the dumbest thing you've done to impress someone?",
      "What's the weirdest food combo you secretly enjoy?"
    ],
    deep: [
      "What's something you're afraid to admit to yourself?",
      "What's a belief you held as a kid that you no longer believe?",
      "What's one thing you'd change about how you were raised?",
      "What does success mean to you, really?",
      "What's a fear you've never told anyone about?"
    ],
    party: [
      "Who in this room would you trust with a secret?",
      "What's the wildest party you've ever been to?",
      "Have you ever pretended to like someone's gift?",
      "What's your go-to karaoke song?",
      "Who's the last person you texted and why?"
    ],
    couples: [
      "What was your first impression of your partner?",
      "What's one thing your partner does that melts your heart?",
      "What's a small habit of your partner's you secretly love?",
      "What's the most romantic thing anyone has done for you?",
      "What's one thing you wish your partner knew about you?"
    ],
    embarrassing: [
      "What's the most embarrassing thing in your search history?",
      "Have you ever been caught talking to yourself?",
      "What's the most embarrassing outfit you've ever worn in public?",
      "What's a lie you told that spiraled out of control?",
      "What's the most embarrassing thing that happened at school/work?"
    ],
    random: [
      "If you could swap lives with someone for a day, who would it be?",
      "What's the last thing you Googled?",
      "What's a talent you have that no one knows about?",
      "If you had to eat one food forever, what would it be?",
      "What's the best advice you've ever received?"
    ]
  },

  dare: {
    funny: [
      "Talk in an accent for the next 3 rounds.",
      "Do your best impression of someone in the room.",
      "Try to lick your elbow.",
      "Speak in rhymes for the next 2 minutes.",
      "Do 10 seconds of your best robot dance."
    ],
    party: [
      "Let the group pick a new song to be your ringtone.",
      "Do a dramatic reading of your last text message.",
      "Let someone draw a mustache on your hand with a pen.",
      "Take a silly selfie and show the group.",
      "Sing the chorus of a song chosen by the group."
    ],
    couples: [
      "Give your partner a genuine compliment they've never heard before.",
      "Recreate your first date in 30 seconds.",
      "Let your partner pick your outfit for tomorrow.",
      "Whisper something sweet to your partner.",
      "Give your partner a 30-second shoulder massage."
    ],
    extreme: [
      "Eat a spoonful of a condiment of the group's choice.",
      "Let someone else post a status on your social media.",
      "Hold a plank for 45 seconds.",
      "Call a friend and sing them happy birthday even if it's not their birthday.",
      "Do 20 jumping jacks right now."
    ],
    silly: [
      "Wear your clothes backwards for the rest of the game.",
      "Talk without using your hands for 3 minutes.",
      "Balance a spoon on your nose for 15 seconds.",
      "Do your best animal impression of the group's choice.",
      "Let the group style your hair for one round."
    ],
    random: [
      "Show the group the last photo in your camera roll.",
      "Let the person to your left choose your next dare.",
      "Text a random contact 'I know what you did 👀' with no context.",
      "Do an impression of the person to your right.",
      "Freestyle rap for 15 seconds about the room you're in."
    ]
  }
};

/* Utility: get list of category keys for a given type ("truth"/"dare") */
function getCategories(type){
  return Object.keys(QUESTION_BANK[type] || {});
}

/* Utility: nicely format a category key for display, e.g. "deep" -> "Deep" */
function formatCategoryName(key){
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g,' ');
}
