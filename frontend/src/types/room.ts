export interface Room {
    id: number;
    roomNumber: string;
    building: string;
    floor: string;
    capacity: number;
}

export type RoomFormInputs = Omit<Room, 'id'>;
