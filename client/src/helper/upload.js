const cloudApi = import.meta.env.VITE_CLOUD_API; // Cloudinary cloud name
const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET; // Upload preset from .env

const url = `https://api.cloudinary.com/v1_1/${cloudApi}/image/upload`; // Change `auto` to `image`

const uploadFile = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset); // This must be correct!

        console.log("Uploading to Cloudinary:", file);
        console.log("Cloudinary API URL:", url);
        console.log("Using Upload Preset:", uploadPreset);

        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
        }

        const responseData = await response.json();
        return responseData.secure_url; // Return the uploaded image URL

    } catch (error) {
        console.error("Error uploading file:", error);
        return null; // Handle failure gracefully
    }
};

export default uploadFile;
