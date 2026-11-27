// server/utils/dataExport.js
// Builds the JSON payload for GET /api/user/data-export.
//
// Only the requesting user's own rows are ever read, and the field lists
// below are allowlists: password hashes, tokens and other users' data are
// never included by construction. Uploaded FILES are not included — only
// their records (Cloudinary URL + public id); the files themselves stay
// where they are stored.
//
// Pure function over model objects so tests can pass fakes (same pattern
// as server/utils/creditReset.js). `profile` comes from req.user, which
// `protect` already loaded without the password hash.
export const buildUserDataExport = async ({ Content, Feedback, Suggestion }, userId, profile) => {
  const [generations, feedback, suggestions] = await Promise.all([
    Content.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    Feedback.find({ user: userId }).sort({ createdAt: -1 }).lean(),
    Suggestion.find({ suggestedBy: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  // Media attached to the user's history entries — records only.
  const uploads = generations
    .filter((g) => g.mediaUrl)
    .map((g) => ({
      mediaUrl: g.mediaUrl,
      mediaPublicId: g.mediaPublicId || '',
      mediaType: g.mediaType || '',
      attachedToGeneration: String(g._id),
      createdAt: g.createdAt,
    }));

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      name: profile.name,
      email: profile.email,
      credits: profile.credits,
      subscription: profile.subscription,
      memberSince: profile.createdAt,
    },
    generations: generations.map((g) => ({
      id: String(g._id),
      type: g.type,
      subtype: g.subtype || '',
      prompt: g.prompt,
      output: g.output,
      language: g.language,
      format: g.format,
      creditsUsed: g.creditsUsed,
      favorite: g.favorite,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    })),
    uploads,
    feedback: feedback.map((f) => ({
      page: f.page,
      category: f.category,
      message: f.message,
      createdAt: f.createdAt,
    })),
    glossarySuggestions: suggestions.map((s) => ({
      word: s.word,
      language: s.language,
      suggestedTranslation: s.suggestedTranslation,
      status: s.status,
      createdAt: s.createdAt,
    })),
    counts: {
      generations: generations.length,
      uploads: uploads.length,
      feedback: feedback.length,
      glossarySuggestions: suggestions.length,
    },
  };
};
