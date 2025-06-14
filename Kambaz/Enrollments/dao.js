import model from "./model.js";

export const findCoursesForUser = async (userId) => {
  const enrollments = await model.find({ user: userId }).populate("course");
  return enrollments.map((enrollment) => enrollment.course);
};

export const findUsersForCourse = async (courseId) => {
  const enrollments = await model.find({ course: courseId }).populate("user");
  return enrollments.map((enrollment) => enrollment.user);
};

export const enrollUserInCourse = (user, course) => {
  return model.create({ user, course, _id: `${user}-${course}` });
};

export const unenrollUserFromCourse = (user, course) => {
  return model.deleteOne({ user, course });
};