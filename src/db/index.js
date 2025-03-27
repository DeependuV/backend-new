import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB Connected !! Db HOST: ${connectionInstance.connection.host}`);
        // console.log(connectionInstance, "hello");
        // check what is there in connectionInstance
    } catch (error) {
        console.log("MongoDB connect error ", error);
        process.exit(1);
    }
}

export default connectDB