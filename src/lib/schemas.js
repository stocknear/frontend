import { z } from "zod";

export const loginUserSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Email must be a valid email." }),
  password: z.string({ required_error: "Password is required" }),
});

export const registerUserSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .email({ message: "Email must be a valid email" }),
    password: z
      .string({ required_error: "Password is required" })
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&+\-,.\[\]{};':"\\|/=\(\)\^_*]{8,}$/,
        {
          message:
            "Password must be a minimum of 8 characters & contain at least one letter, one number, and one special character.",
        },
      ),
    passwordConfirm: z
      .string({ required_error: "Confirm Password is required" })
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&+\-,.\[\]{};':"\\|/=\(\)\^_*]{8,}$/,
        {
          message:
            "Password must be a minimum of 8 characters & contain at least one letter, one number, and one special character.",
        },
      ),
  })
  .superRefine(({ passwordConfirm, password }, ctx) => {
    if (passwordConfirm !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password & Confirm password must match",
        path: ["password"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password & Confirm password must match",
        path: ["passwordConfirm"],
      });
    }
  });

export const createPostTextSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, { message: "Title is required" })
    .max(300, { message: "Title must be 300 characters or less" })
    .trim(),

  //url: z.string().optional().url({ message: 'URL must be a valid URL' }),
  tagline: z.string(),
  tagTopic: z.string(),
  atLeastOneTag: z
    .string({ required_error: "At least 1 tag is required" })
    .min(1, { message: "At least 1 tag is required" }),
  description: z.string(),
  postType: z.string({ required_error: "PostType is required." }),
  user: z.string({ required_error: "User is required." }),
});

const imageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

const videoTypes = ["video/mp4", "video/gif"];

export const createPostImageSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, { message: "Title is required" })
    .max(300, { message: "Title must be 300 characters or less" })
    .trim(),
  tagTopic: z.string(),
  tagline: z.string(),
  atLeastOneTag: z
    .string({ required_error: "At least 1 tag is required" })
    .min(1, { message: "At least 1 tag is required" }),
  thumbnail: z.instanceof(File).superRefine((val, ctx) => {
    if (val) {
      if (val.size > 5121440) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File must be less than 5MB",
        });
      }

      if (
        val.type &&
        !imageTypes.includes(val.type) &&
        !videoTypes.includes(val.type)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Unsupported file type. Supported formats: jpeg, jpg, png, webp, svg",
        });
      }
    }
  }),
  postType: z.string({ required_error: "PostType is required." }),
  user: z.string({ required_error: "User is required." }),
});

export const createPostLinkSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, { message: "Title is required" })
    .max(300, { message: "Title must be 300 characters or less" })
    .trim(),
  tagTopic: z.string(),
  tagline: z.string(),
  atLeastOneTag: z
    .string({ required_error: "At least 1 tag is required" })
    .min(1, { message: "At least 1 tag is required" }),
  link: z.string().url({ message: "URL must be a valid URL" }),
  description: z.string(),
  /*
	thumbnail: z
		.instanceof(Blob)
		.superRefine((val, ctx) => {
			if (val) {
				if (val.size > 5242880) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Image must be less than 5MB'
					});
				}

				if (!imageTypes.includes(val.type)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: 'Unsupported file type. Supported formats: jpeg, jpg, png, webp, svg, gif'
					});
				}
			}
		}),
		*/
  postType: z.string({ required_error: "PostType is required." }),
  user: z.string({ required_error: "User is required." }),
});

//export const updatePostSchema = createPostSchema.omit({ user: true });

export const updatePersonalDataSchema = z.object({
  /*
	email: z
		.string({ required_error: 'Email is required' })
		.email({ message: 'Email must be a valid email' }),
	*/
  username: z
    .string({ required_error: "Username is required" })
    .min(2, { message: "Username must be at least 2 characters" })
    .max(24, { message: "Username must be 24 characters or less" })
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, {
      message:
        "Username can only contain letters, numbers, and special characters.",
    }), // Updated regex pattern
});

export const updateEmailSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email({ message: "Email must be a valid email" }),
});

export const updateUsernameSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(2, { message: "Username must be at least 2 characters" })
    .max(24, { message: "Username must be 24 characters or less" })
    .regex(/^[a-zA-Z0-9]*$/, {
      message: "Username can only contain letters or numbers.",
    }),
});

export const updatePasswordSchema = z
  .object({
    oldPassword: z.string({ required_error: "Old password is required" }),
    password: z
      .string({ required_error: "Password is required" })
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&+\-,.\[\]{};':"\\|/=\(\)\^_*]{8,}$/,
        {
          message:
            "Password must be a minimum of 8 characters & contain at least one letter, one number, and one special character.",
        },
      ),
    passwordConfirm: z
      .string({ required_error: "Confirm Password is required" })
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&+\-,.\[\]{};':"\\|/=\(\)\^_*]{8,}$/,
        {
          message:
            "Password must be a minimum of 8 characters & contain at least one letter, one number, and one special character.",
        },
      ),
  })
  .superRefine(({ passwordConfirm, password }, ctx) => {
    if (passwordConfirm !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password & Confirm password must match",
        path: ["password"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password & Confirm password must match",
        path: ["passwordConfirm"],
      });
    }
  });


  export const newPasswordSchema = z
  .object({
    token: z.string({ required_error: "Valid Token is required" }),
    password: z
      .string({ required_error: "Password is required" })
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&+\-,.\[\]{};':"\\|/=\(\)\^_*]{8,}$/,
        {
          message:
            "Password must be a minimum of 8 characters & contain at least one letter, one number, and one special character.",
        },
      ),
    passwordConfirm: z
      .string({ required_error: "Confirm Password is required" })
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&+\-,.\[\]{};':"\\|/=\(\)\^_*]{8,}$/,
        {
          message:
            "Password must be a minimum of 8 characters & contain at least one letter, one number, and one special character.",
        },
      ),
  })
  .superRefine(({ passwordConfirm, password }, ctx) => {
    if (passwordConfirm !== password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password & Confirm password must match",
        path: ["password"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password & Confirm password must match",
        path: ["passwordConfirm"],
      });
    }
  });

export const updateProfileSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(1, { message: "Name is required" })
    .max(64, { message: "Name must be 64 characters or less" })
    .trim(),
  avatar: z
    .instanceof(Blob)
    .optional()
    .superRefine((val, ctx) => {
      if (val) {
        if (val.size > 5242880) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Avatar must be less than 5MB",
          });
        }

        if (!imageTypes.includes(val.type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Unsupported file type. Supported formats: jpeg, jpg, png, webp, svg, gif",
          });
        }
      }
    }),
});

export const updateAvatarSchema = z.object({
  avatar: z.instanceof(File).superRefine((val, ctx) => {
    if (val) {
      if (val.size > 5242880) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Avatar must be less than 5MB",
        });
      }

      if (
        val.type &&
        !imageTypes.includes(val.type) &&
        !videoTypes.includes(val.type)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Unsupported file type. Supported formats: jpeg, jpg, png, webp, svg, gif",
        });
      }
    }
  }),
});

export const createCommentTextSchema = z.object({
  comment: z
    .string({ required_error: "Comment cannot be empty" })
    .min(1, { message: "Comment cannot be empty" })
    //.max(40000, { message: 'Comment is too long. Keep it simple and concise bruv!' })
    .trim(),
  user: z.string({ required_error: "User is required." }),
  post: z.string({ required_error: "Post is required." }),
  reply: z.string(),
});

export const updateCommentTextSchema = z.object({
  comment: z
    .string({ required_error: "Comment cannot be empty" })
    .min(1, { message: "Comment cannot be empty" })
    //.max(40000, { message: 'Comment is too long. Keep it simple and concise bruv!' })
    .trim(),
});

export const createCommentImageSchema = z.object({
  comment: z
    .string({ required_error: "Comment cannot be empty" })
    .min(1, { message: "Comment cannot be empty" })
    //.max(40000, { message: 'Comment is too long. Keep it simple and concise bruv!' })
    .trim(),
  image: z
    .instanceof(Blob, { message: "Image is required" })
    .superRefine((val, ctx) => {
      if (val) {
        if (val.size > 5242880) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Image must be less than 5MB",
          });
        }

        if (!imageTypes.includes(val.type)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Unsupported file type. Supported formats: jpeg, jpg, png, webp, svg, gif",
          });
        }
      }
    }),
  user: z.string({ required_error: "User is required." }),
  post: z.string({ required_error: "Post is required." }),
  reply: z.string(),
});

export const createNotebookSchema = z.object({
  title: z
    .string({ required_error: "Title cannot be empty" })
    .min(1, { message: "Title cannot be empty" })
    .max(100, {
      message: "Title is too long. Keep it simple and concise bruv!",
    })
    .trim(),
  user: z.string({ required_error: "User is required." }),
});

export const createStrategySchema = z.object({
  title: z
    .string({ required_error: "Title cannot be empty" })
    .min(1, { message: "Title cannot be empty" })
    .max(100, {
      message: "Title is too long. Keep it simple and concise bruv!",
    })
    .trim(),
  rules: z.string().trim(),
  results: z.string().trim(),
  liveResults: z.string().trim(),
  user: z.string({ required_error: "User is required." }),
});

export const createPortfolioSchema = z.object({
  accountValue: z.string().trim(),
  availableCash: z.string().trim(),
  overallReturn: z.string().trim(),
  rank: z.string().trim(),
  holdings: z.string().trim(),
  tradingHistory: z.string().trim(),
  metrics: z.string().trim(),
  user: z.string({ required_error: "User is required." }),
});

export const createWatchListSchema = z.object({
  title: z
    .string({ required_error: "Title cannot be empty" })
    .min(1, { message: "Title cannot be empty" })
    .max(100, {
      message: "Title is too long. Keep it simple and concise bruv!",
    })
    .trim(),
  ticker: z.string().trim(),
  user: z.string({ required_error: "User is required." }),
});

export const editWatchListSchema = z.object({
  title: z
    .string({ required_error: "Title cannot be empty" })
    .min(1, { message: "Title cannot be empty" })
    .max(100, {
      message: "Title is too long. Keep it simple and concise bruv!",
    })
    .trim(),
  watchListId: z.string({ required_error: "Id is required." }),
});