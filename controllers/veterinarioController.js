import Veterinario from "../models/Veterinario.js";
import generarJWT from "../helpers/generarJWT.js";
import generarId from "../helpers/generarId.js";
import emailRegistro from "../helpers/emailRegistro.js";
import emailOlvidePassword from "../helpers/emailOlvidePassword.js";

const registrar = async( req, res ) => {

    const { email, nombre } = req.body;

    // Comprobamos si el email ya está registrado
    const existeUsuario = await Veterinario.findOne({email})

    if(existeUsuario) {
        const error = new Error('Usuario registrado');
        return res.status(400).json({msg: error.message});
    }

    try {
        const veterinario = new Veterinario(req.body);
        const veterinarioGuardado = await veterinario.save();

        // Enviamos el Email
        emailRegistro({email, nombre, token: veterinarioGuardado.token});

        res.json(veterinarioGuardado);
    } catch (error) {
        console.log(error);
    }
};

const perfil = ( req, res ) => {
    const { veterinario } = req;

    res.json(veterinario);
};

const confirmar = async ( req, res ) => {
    const { token } = req.params;

    const usuarioConfirmar = await Veterinario.findOne({token});

    if(!usuarioConfirmar) {
        const error = new Error('Token no valido');
        return res.status(404).json({msg: error.message});
    }

    try {
        usuarioConfirmar.token = null;
        usuarioConfirmar.confirmado = true;
        await usuarioConfirmar.save();

        res.json({ msg: "Usuario confirmado correctamente" });
    } catch (error) {
        console.log(error);
    }
};

const autenticar = async (req, res) => {

    const { email, password } = req.body;

    const usuario = await Veterinario.findOne({email});

    // Comprobamos si el usuario existe
    if(!usuario) {
        const error = new Error('Usuario no existe');
        return res.status(403).json({msg: error.message});
    }

    // Comprobamos si el usuario ha sido confirmado
    if(!usuario.confirmado) {
        const error = new Error('Tu cuenta no ha sido confirmada');
        return res.status(403).json({msg: error.message});
    }

    // Revisamos password
    if(await usuario.comprobarPassword(password)) {
        res.json({
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            token: usuario.token,
            token: usuario.token,
            token: generarJWT(usuario.id)
        })
    } else {
        const error = new Error('La contraseña es incorrecta');
        return res.status(403).json({msg: error.message});
    }
};

const olvidePassword = async (req, res) => {
    const { email } = req.body;
    
    const existeVeterinario = await Veterinario.findOne({email});

    if(!existeVeterinario) {
        const error = new Error("El usuario no existe");
        return res.status(400).json({msg: error.message});
    }

    try {
        existeVeterinario.token = generarId();
        await existeVeterinario.save();

        // Enviamos el Email
        emailOlvidePassword({
            email, nombre: existeVeterinario.nombre , token: existeVeterinario.token});

        res.json({ msg: "Hemos enviado un email con las instrucciones" });
    } catch (error) {
        console.log(error)
    }
};

const comprobarToken = async (req, res) => {
    const { token } = req.params;

    const tokenValido = await Veterinario.findOne({token});

    if(tokenValido) {
        res.json({msg: "Token válido y el usuario existe"});
    } else {
        const error = new Error("Token no válido");
        return res.status(400).json({msg: error.message});
    }
};

const nuevoPassword = async (req, res) => {
    const {token} = req.params;
    const {password} = req.body;

    const veterinario = await Veterinario.findOne({token});

    if(!veterinario) {
        const error = new Error("Usuario para cambio de contraseña no encontrado");
        return res.status(400).json({msg: error.message});
    }

    try {
        veterinario.token = null;
        veterinario.password = password;
        await veterinario.save();
        res.json({msg: "Contraseña modificada correctamente"});
    } catch (error) {
        console.log(error);
    }
};

const actualizarPerfil = async (req, res) => {
    const { nombre, web, telefono, email } = req.body;

    const veterinario = await Veterinario.findById(req.params.id);
    if(!veterinario) {
        const error = new Error("Usuario no encontrado");
        return res.status(400).json({msg: error.message});
    }

    if(veterinario.email !== email) {
        const existeEmail = await Veterinario.findOne({email})
        if(existeEmail) {
            const error = new Error("Este email ya está en uso");
            return res.status(400).json({msg: error.message});
        }
    }

    try {
        veterinario.nombre = nombre;
        veterinario.web = web;
        veterinario.telefono = telefono;
        veterinario.email = email;
        const veterinarioActualizado = await veterinario.save();
        res.json({msg: veterinarioActualizado})
    } catch (error) {
        console.log(error)
    }
};

const actualizarPassword = async (req, res) => {
    // Leer los datos
    const { id } = req.veterinario
    const { pwd_actual, pwd_nuevo } = req.body

    // Comprobar que el veterinario existe
    const veterinario = await Veterinario.findById(id);
    if(!veterinario) {
        const error = new Error("Usuario no encontrado");
        return res.status(400).json({msg: error.message});
    }

    // Comprobar su password
    if(await veterinario.comprobarPassword(pwd_actual)){
        // Almacenar nueva password
        veterinario.password = pwd_nuevo
        await veterinario.save()
        res.json({msg: 'Password modificada correctamente'})
    } else {
        const error = new Error("La contraseña actual es incorrecta");
        return res.status(400).json({msg: error.message});
    }
}

export { registrar, perfil, confirmar, autenticar, olvidePassword, comprobarToken, nuevoPassword, actualizarPerfil,actualizarPassword };