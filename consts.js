require('dotenv').config();

const center_name = process.env.NAME_OF_CENTER;
const sent_directory = process.env.SENT_DIRECTORY;
const received_directory = process.env.RECEIVED_DIRECTORY;
const isClinic = process.env.IS_CLINIC === 'true' ? true : false;
const PORT = process.env.PORT || '3500';
const clinics = {
    "BEHAFARIN": {
        "host": "192.168.1.122",
        "port": "2223",
        "user": "root",
        "warehouse_id": "38df3d75-7b0e-477c-a0c8-cfe911ad0499"
    },
    "GOLSHAHR": {
        "host": "192.168.1.122",
        "port": "2224",
        "user": "root",
        "warehouse_id": "7bea89aa-3a38-4892-a998-8d35ede52100",
    },
    "MOHAMMADSHAHR": {
        "host": "192.168.1.122",
        "port": "2225",
        "user": "root",
        "warehouse_id": "56a5c302-e70e-429e-9339-faee61877336",
    },
    "FARDIS": {
        "host": "192.168.1.122",
        "port": "2226",
        "user": "root",
        "warehouse_id": "b39f6509-1f2e-49c2-9cd6-24fc15cf82de",
    },
    "AMOL": {
        "host": "192.168.1.122",
        "port": "2227",
        "user": "root",
        "warehouse_id": "d148b18c-8984-46e6-95fe-524b3ac599ef",
    }
}

const chain = {
    "host": "192.168.1.122",
    "port": "2220",
    "user": "root",
}
module.exports = {
    center_name,
    sent_directory,
    received_directory,
    isClinic,
    PORT,
    clinics,
    chain
}