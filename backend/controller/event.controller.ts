import { Request, Response } from "express";
import { Event } from "../models/event.model";
import uploadImageOnCloudinary from "../utils/uploadImage";
import { Club } from "../models/club.model";

// Create Event
export const createEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, mode, registrationFee, registrationEndDate, eventStartDate, eventEndDate, startTime, endTime, formLink } = req.body;
        const file = req.file;

        if (!file) {
            res.status(400).json({
                success: false,
                message: "Image is required."
            });
            return;
        }

        const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File); // Assuming cloudinary upload utility

        const newEvent = await Event.create({
            name,
            description,
            mode,
            registrationFee,
            registrationEndDate,
            eventStartDate,
            eventEndDate,
            startTime,
            endTime,
            formLink,
            image: imageUrl
        });

        res.status(201).json({
            success: true,
            message: "Event created successfully.",
            event: newEvent
        });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Fetch All Events
export const fetchAllEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const events = await Event.find();
        if (!events || events.length === 0) {
            res.status(404).json({
                success: false,
                message: "No events found.",
                events: []
            });
            return;
        }
        res.status(200).json({
            success: true,
            events
        });
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Update Event
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const file = req.file;

        const event = await Event.findById(id);
        if (!event) {
            res.status(404).json({
                success: false,
                message: "Event not found."
            });
            return;
        }

        // Update fields
        Object.assign(event, req.body);

        // Update image if provided
        if (file) {
            const imageUrl = await uploadImageOnCloudinary(file as Express.Multer.File);
            event.image = imageUrl;
        }

        await event.save();
        res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            event
        });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Delete Event
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const deletedEvent = await Event.findByIdAndDelete(id);
        if (!deletedEvent) {
            res.status(404).json({
                success: false,
                message: "Event not found."
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Event deleted successfully."
        });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};




// Search Clubs and Events
export const searchClubsAndEvents = async (req: Request, res: Response): Promise<void> => {
    try {
        const searchText = req.query.q as string;
        if (!searchText) {
            res.status(400).json({
                success: false,
                message: "Search text is required."
            });
            return;
        }

        const clubSearchQuery = {
            $or: [
                { clubName: { $regex: searchText, $options: "i" } },
                { eventTypes: { $regex: searchText, $options: "i" } },
                { coreTeam: { $regex: searchText, $options: "i" } }
            ]
        };

        const eventSearchQuery = {
            $or: [
                { name: { $regex: searchText, $options: "i" } },
                { description: { $regex: searchText, $options: "i" } }
            ]
        };

        // Search in Club and Event collections
        const [clubs, events] = await Promise.all([
            Club.find(clubSearchQuery),
            Event.find(eventSearchQuery)
        ]);

        res.status(200).json({
            success: true,
            data: {
                clubs,
                events
            }
        });
    } catch (error) {
        console.error("Error searching clubs and events:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

