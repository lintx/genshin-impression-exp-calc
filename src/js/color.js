
function diff(c1, c2)
{
    c1 = rgb_to_lab(c1);
    c2 = rgb_to_lab(c2);
    return ciede2000(c1, c2);
}

function ciede2000(c1,c2)
{
    /**
     * Implemented as in "The CIEDE2000 Color-Difference Formula:
     * Implementation Notes, Supplementary Test Data, and Mathematical Observations"
     * by Gaurav Sharma, Wencheng Wu and Edul N. Dalal.
     */

        // Get L,a,b values for color 1
    let L1 = c1.L;
    let a1 = c1.a;
    let b1 = c1.b;

    // Get L,a,b values for color 2
    let L2 = c2.L;
    let a2 = c2.a;
    let b2 = c2.b;

    // Weight factors
    let kL = 1;
    let kC = 1;
    let kH = 1;

    /**
     * Step 1: Calculate C1p, C2p, h1p, h2p
     */
    let C1 = Math.sqrt(Math.pow(a1, 2) + Math.pow(b1, 2)) //(2)
    let C2 = Math.sqrt(Math.pow(a2, 2) + Math.pow(b2, 2)) //(2)

    let a_C1_C2 = (C1+C2)/2.0;             //(3)

    let G = 0.5 * (1 - Math.sqrt(Math.pow(a_C1_C2 , 7.0) /
        (Math.pow(a_C1_C2, 7.0) + Math.pow(25.0, 7.0)))); //(4)

    let a1p = (1.0 + G) * a1; //(5)
    let a2p = (1.0 + G) * a2; //(5)

    let C1p = Math.sqrt(Math.pow(a1p, 2) + Math.pow(b1, 2)); //(6)
    let C2p = Math.sqrt(Math.pow(a2p, 2) + Math.pow(b2, 2)); //(6)

    let h1p = hp_f(b1, a1p); //(7)
    let h2p = hp_f(b2, a2p); //(7)

    /**
     * Step 2: Calculate dLp, dCp, dHp
     */
    let dLp = L2 - L1; //(8)
    let dCp = C2p - C1p; //(9)

    let dhp = dhp_f(C1,C2, h1p, h2p); //(10)
    let dHp = 2*Math.sqrt(C1p*C2p)*Math.sin(radians(dhp)/2.0); //(11)

    /**
     * Step 3: Calculate CIEDE2000 Color-Difference
     */
    let a_L = (L1 + L2) / 2.0; //(12)
    let a_Cp = (C1p + C2p) / 2.0; //(13)

    let a_hp = a_hp_f(C1,C2,h1p,h2p); //(14)
    let T = 1-0.17*Math.cos(radians(a_hp-30))+0.24*Math.cos(radians(2*a_hp))+
        0.32*Math.cos(radians(3*a_hp+6))-0.20*Math.cos(radians(4*a_hp-63)); //(15)
    let d_ro = 30 * Math.exp(-(Math.pow((a_hp-275)/25,2))); //(16)
    let RC = Math.sqrt((Math.pow(a_Cp, 7.0)) / (Math.pow(a_Cp, 7.0) + Math.pow(25.0, 7.0)));//(17)
    let SL = 1 + ((0.015 * Math.pow(a_L - 50, 2)) /
        Math.sqrt(20 + Math.pow(a_L - 50, 2.0)));//(18)
    let SC = 1 + 0.045 * a_Cp;//(19)
    let SH = 1 + 0.015 * a_Cp * T;//(20)
    let RT = -2 * RC * Math.sin(radians(2 * d_ro));//(21)
    let dE = Math.sqrt(Math.pow(dLp /(SL * kL), 2) + Math.pow(dCp /(SC * kC), 2) +
        Math.pow(dHp /(SH * kH), 2) + RT * (dCp /(SC * kC)) *
        (dHp / (SH * kH))); //(22)
    return dE;
}

function degrees(n) { return n*(180/Math.PI); }
function radians(n) { return n*(Math.PI/180); }

function hp_f(x,y) //(7)
{
    if(x === 0 && y === 0) return 0;
    else{
        let tmphp = degrees(Math.atan2(x,y));
        if(tmphp >= 0) return tmphp
        else           return tmphp + 360;
    }
}

function dhp_f(C1, C2, h1p, h2p) //(10)
{
    if(C1*C2 === 0)              return 0;
    else if(Math.abs(h2p-h1p) <= 180) return h2p-h1p;
    else if((h2p-h1p) > 180)     return (h2p-h1p)-360;
    else if((h2p-h1p) < -180)    return (h2p-h1p)+360;
    else                         throw(new Error());
}

function a_hp_f(C1, C2, h1p, h2p) { //(14)
    if(C1*C2 === 0)                                     return h1p+h2p
    else if(Math.abs(h1p-h2p)<= 180)                         return (h1p+h2p)/2.0;
    else if((Math.abs(h1p-h2p) > 180) && ((h1p+h2p) < 360))  return (h1p+h2p+360)/2.0;
    else if((Math.abs(h1p-h2p) > 180) && ((h1p+h2p) >= 360)) return (h1p+h2p-360)/2.0;
    else                                                throw(new Error());
}

function rgb_to_lab(c)
{
    return xyz_to_lab(rgb_to_xyz(c))
}

function rgb_to_xyz(c)
{
    c = normalize_rgb(c);
    // Based on http://www.easyrgb.com/index.php?X=MATH&H=02
    let R = ( c.R / 255 );
    let G = ( c.G / 255 );
    let B = ( c.B / 255 );

    if ( R > 0.04045 ) R = Math.pow(( ( R + 0.055 ) / 1.055 ),2.4);
    else               R = R / 12.92;
    if ( G > 0.04045 ) G = Math.pow(( ( G + 0.055 ) / 1.055 ),2.4);
    else               G = G / 12.92;
    if ( B > 0.04045 ) B = Math.pow(( ( B + 0.055 ) / 1.055 ), 2.4);
    else               B = B / 12.92;

    R *= 100;
    G *= 100;
    B *= 100;

    // Observer. = 2°, Illuminant = D65
    let X = R * 0.4124 + G * 0.3576 + B * 0.1805;
    let Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    let Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
    return {'X' : X, 'Y' : Y, 'Z' : Z};
}
function xyz_to_lab(c)
{
    // Based on http://www.easyrgb.com/index.php?X=MATH&H=07
    let ref_Y = 100.000;
    let ref_Z = 108.883;
    let ref_X = 95.047; // Observer= 2°, Illuminant= D65
    let Y = c.Y / ref_Y;
    let Z = c.Z / ref_Z;
    let X = c.X / ref_X;
    if ( X > 0.008856 ) X = Math.pow(X, 1/3);
    else                X = ( 7.787 * X ) + ( 16 / 116 );
    if ( Y > 0.008856 ) Y = Math.pow(Y, 1/3);
    else                Y = ( 7.787 * Y ) + ( 16 / 116 );
    if ( Z > 0.008856 ) Z = Math.pow(Z, 1/3);
    else                Z = ( 7.787 * Z ) + ( 16 / 116 );
    let L = ( 116 * Y ) - 16;
    let a = 500 * ( X - Y );
    let b = 200 * ( Y - Z );
    return {'L' : L , 'a' : a, 'b' : b};
}

function normalize_rgb(c)
{
    let new_c = {R: c.R || c.r || 0,
        G: c.G || c.g || 0,
        B: c.B || c.b || 0};
    if (typeof c.a !== "undefined" || typeof c.A !== "undefined") {
        new_c.A = c.A || c.a || 0;
    }
    return new_c;
}
export default diff