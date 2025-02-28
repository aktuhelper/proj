import usermodel from "../database/usermodel.js";

async function searchUser(request, response) {
  try {
    const { search } = request.query; // ✅ Correctly extract from query parameters

    if (!search || typeof search !== "string" || search.trim() === "") {
      return response.status(400).json({
        message: "Invalid search input. Please provide a valid search string.",
        success: false,
      });
    }

    const query = new RegExp(search, "i");

    const users = await usermodel
      .find({
        $or: [{ name: query }, { email: query }],
      })
      .select("-password");

    if (users.length === 0) {
      return response.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return response.status(200).json({
      message: "Users found",
      data: users,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      error: error.message || error,
      success: false,
    });
  }
}

export default searchUser;
