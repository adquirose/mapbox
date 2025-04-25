import { createTheme } from "@mui/material";
import { grey } from '@mui/material/colors'

export const purpleTheme = createTheme({
    palette:{
        background:{
            mode:'light'
        },
        primary:{
            main:'#262254'
        },
        secondary:{
            main:'#543884'
        },
        error:{
            main:grey.A400
        },
        grey:{
            50:'#f5f5f5',
            100:'#e0e0e0',
            200:grey[200],
            300:'#bdbdbd',
            400:'#9e9e9e',
            500:'#757575',
            600:'#616161',
            700:'#424242',
            800:'#212121',
            900:grey[900],
        },
    },
})
