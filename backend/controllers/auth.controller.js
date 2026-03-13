import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

export async function register(req, res, next) {
  try {
    const { full_name, email, password, telefone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        error: "full_name, email e password são obrigatórios",
      });
    }

    const emailNormalizado = email.toLowerCase();

    const { data: existente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", emailNormalizado)
      .maybeSingle();

    if (existente) {
      return res.status(409).json({ error: "Email já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("usuarios")
      .insert([
        {
          full_name,
          email: emailNormalizado,
          password: hashedPassword,
          telefone: telefone || null,
          is_admin: false,
        },
      ])
      .select("id, full_name, email, telefone, is_admin");

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const emailNormalizado = email.toLowerCase();

    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", emailNormalizado)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        telefone: user.telefone,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.json(req.user);
}