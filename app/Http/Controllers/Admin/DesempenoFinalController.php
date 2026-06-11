<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\DesempenoFinalService;
use Inertia\Inertia;


use Symfony\Component\HttpFoundation\StreamedResponse;
use Barryvdh\DomPDF\Facade\Pdf; // PDF



class DesempenoFinalController extends Controller
{
    // =========================
    // VISTA
    // =========================
    public function index()
    {
        return Inertia::render('Admin/DesempenoFinal');
    }

    // =========================
    // DATA GENERAL
    // =========================
    public function data()
    {
        return response()->json(
            DesempenoFinalService::listar()
        );
    }

    // =========================
    // APROBADOS
    // =========================
    public function aprobados()
    {
        return response()->json(
            DesempenoFinalService::aprobados()
        );
    }

    // =========================
    // REPROBADOS
    // =========================
    public function reprobados()
    {
        return response()->json(
            DesempenoFinalService::reprobados()
        );
    }

    // =========================
    // GENERAR RESULTADOS (SP)
    // =========================
    public function generar()
    {
        DesempenoFinalService::generar();

        return response()->json([
            'ok' => true,
            'message' => 'Resultados generados correctamente'
        ]);
    }

    public function exportExcel()
{
    $data = \App\Services\DesempenoFinalService::listar();

    $filename = "desempeno_final.csv";

    $headers = [
        "Content-type" => "text/csv",
        "Content-Disposition" => "attachment; filename=$filename",
        "Pragma" => "no-cache",
        "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
        "Expires" => "0"
    ];

    $callback = function () use ($data) {
        $file = fopen('php://output', 'w');

        // encabezados
        fputcsv($file, [
            'CI',
            'Postulante',
            'Matematicas',
            'Fisica',
            'Computacion',
            'Ingles',
            'Promedio Final',
            'Estado',
            'Carrera'
        ]);

        foreach ($data as $row) {
            fputcsv($file, [
                $row->ci,
                $row->postulante,
                $row->promedio_matematicas,
                $row->promedio_fisica,
                $row->promedio_computacion,
                $row->promedio_ingles,
                $row->promedio_final,
                $row->aprobado ? 'APROBADO' : 'REPROBADO',
                $row->carrera ?? '-'
            ]);
        }

        fclose($file);
    };

    return response()->stream($callback, 200, $headers);
}
}