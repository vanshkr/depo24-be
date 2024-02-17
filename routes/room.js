import express from "express";
import { getRoomDetails, getRoomList } from "../controllers/room.js";

const router = express.Router();

router.get(`/users/:userId/rooms`, getRoomList);
router.get(`/users/:userId/rooms/:room`, getRoomDetails);

export default router;
