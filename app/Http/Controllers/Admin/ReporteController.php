<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\ReporteService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReporteController extends Controller
{
    /**
     * Vista principal de reportes
     */
    public function index()
    {
        return inertia('Admin/Reportes', [
            'gestiones' => ReporteService::obtenerGestiones()
        ]);
    }

    /**
     * Devuelve los datos del reporte seleccionado en JSON
     */
    public function obtenerReporte(Request $request)
    {
        $type = $request->get('type');
        $gestion = $request->get('gestion');

        $data = $this->obtenerDatosPorTipo($type, $gestion);

        return response()->json([
            'ok' => true,
            'data' => $data
        ]);
    }

    /**
     * Exporta el reporte a formato CSV compatible con Excel
     */
    public function exportarExcel(Request $request)
    {
        $type = $request->get('type', 'reporte');
        $gestion = $request->get('gestion');

        $data = $this->obtenerDatosPorTipo($type, $gestion);
        $headers = $this->obtenerCabeceras($type);

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // 1. Escribir cabeceras
        $colIdx = 'A';
        foreach ($headers as $h) {
            $sheet->setCellValue($colIdx . '1', $h);
            $sheet->getStyle($colIdx . '1')->getFont()->setBold(true);
            $sheet->getStyle($colIdx . '1')->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FF1E3A8A');
            $sheet->getStyle($colIdx . '1')->getFont()->getColor()->setARGB('FFFFFFFF');
            $colIdx++;
        }

        // 2. Escribir datos
        $rowIdx = 2;
        foreach ($data as $row) {
            $colIdx = 'A';
            $rowArr = (array)$row;
            foreach (array_keys($rowArr) as $key) {
                if (str_starts_with($key, 'id_') && $key !== 'id_grupo') {
                    continue;
                }
                $val = $rowArr[$key];
                if (is_bool($val)) {
                    $val = $val ? 'SÍ' : 'NO';
                }
                $sheet->setCellValue($colIdx . $rowIdx, $val);
                $colIdx++;
            }
            $rowIdx++;
        }

        // Autoajustar columnas
        $lastCol = $sheet->getHighestColumn();
        for ($c = 'A'; $c !== $colIdx; $c++) {
            $sheet->getColumnDimension($c)->setAutoSize(true);
        }

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        
        $filename = "reporte_" . str_replace('-', '_', $type) . "_" . ($gestion ?: 'historico') . ".xlsx";
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: max-age=0');
        
        $writer->save('php://output');
        exit;
    }

    /**
     * Exporta el reporte a formato Word mediante descarga de documento HTML formateado
     */
    public function exportarWord(Request $request)
    {
        $type = $request->get('type', 'reporte');
        $gestion = $request->get('gestion');

        $data = $this->obtenerDatosPorTipo($type, $gestion);
        $headers = $this->obtenerCabeceras($type);
        $titulo = strtoupper(str_replace('-', ' ', $type));

        $html = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>";
        $html .= "<head><title>Reporte CUP</title><style>
            @page Section1 {
                size: 11.0in 8.5in;
                margin: 0.8in 0.8in 0.8in 0.8in;
                mso-header-margin: .5in;
                mso-footer-margin: .5in;
                mso-paper-source: 0;
            }
            div.Section1 {
                page: Section1;
            }
            body { font-family: 'Arial', sans-serif; font-size: 10pt; color: #333333; }
            h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; font-size: 14pt; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 6px; text-align: left; font-size: 9.5pt; }
            td { border: 1px solid #cbd5e1; padding: 5px; text-align: left; font-size: 8.5pt; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .meta { font-size: 8.5pt; color: #64748b; margin-bottom: 20px; }
        </style></head><body>";

        $html .= "<div class='Section1'>";
        $html .= "<h2>{$titulo}</h2>";
        $html .= "<div class='meta'>Gestión: " . ($gestion ?: 'Histórico General') . " | Fecha de Generación: " . now()->format('d/m/Y H:i') . "</div>";

        $html .= "<table><thead><tr>";
        foreach ($headers as $h) {
            $html .= "<th>{$h}</th>";
        }
        $html .= "</tr></thead><tbody>";

        foreach ($data as $row) {
            $html .= "<tr>";
            $rowArr = (array)$row;
            foreach (array_keys($rowArr) as $key) {
                if (str_starts_with($key, 'id_') && $key !== 'id_grupo') {
                    continue;
                }
                $val = $rowArr[$key];
                if (is_bool($val)) {
                    $html .= "<td>" . ($val ? 'SÍ' : 'NO') . "</td>";
                } else {
                    $html .= "<td>" . htmlspecialchars($val) . "</td>";
                }
            }
            $html .= "</tr>";
        }

        $html .= "</tbody></table>";
        $html .= "</div></body></html>";

        $filename = "reporte_" . str_replace('-', '_', $type) . "_" . ($gestion ?: 'historico') . ".doc";

        return response($html)
            ->header('Content-Type', 'application/msword')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    /**
     * Resolver la consulta de datos según la llave de tipo de reporte
     */
    private function obtenerDatosPorTipo($type, $gestion)
    {
        switch ($type) {
            case 'docentes-faltas':
                return ReporteService::docentesMasFaltas($gestion);
            case 'docentes-perfecta':
                return ReporteService::docentesAsistenciaPerfecta($gestion);
            case 'ingresos-gestion':
                return ReporteService::ingresosPorGestion();
            case 'ingresos-carrera':
                return ReporteService::ingresosPorCarrera($gestion);
            case 'docentes-aprobados':
                return ReporteService::docentesMayorIndiceAprobados($gestion);
            case 'materia-reprobados':
                return ReporteService::materiaMasIndiceReprobados($gestion);
            case 'postulantes-concurrentes':
                return ReporteService::postulantesConcurrentes();
            case 'general-postulantes':
                return ReporteService::listaGeneralPostulantes($gestion);
            case 'postulantes-aprobados':
                return ReporteService::postulantesAprobados($gestion);
            case 'postulantes-reprobados':
                return ReporteService::postulantesReprobados($gestion);
            case 'promedios-generales':
                return ReporteService::promediosGenerales($gestion);
            case 'grupos-habilitados':
                return ReporteService::cantidadGruposHabilitados($gestion);
            case 'estadisticas-materia':
                return ReporteService::estadisticasPorMateria($gestion);
            case 'docentes-grupo':
                return ReporteService::docentesPorGrupo($gestion);
            case 'grupos-aprobados':
                return ReporteService::gruposMasAprobados($gestion);
            default:
                return [];
        }
    }

    /**
     * Cabeceras descriptivas para el reporte exportado
     */
    private function obtenerCabeceras($type)
    {
        switch ($type) {
            case 'docentes-faltas':
                return ['CI', 'Nombres', 'Apellidos', 'Total Clases', 'Faltas Registradas'];
            case 'docentes-perfecta':
                return ['CI', 'Nombres', 'Apellidos', 'Total Clases', 'Asistencias', 'Porcentaje %'];
            case 'ingresos-gestion':
                return ['Gestión Académica', 'Total Transacciones Aprobadas', 'Total Ingresos (Bs.)'];
            case 'ingresos-carrera':
                return ['Carrera', 'Total Pagos', 'Monto Total Ingresos (Bs.)'];
            case 'docentes-aprobados':
                return ['CI', 'Nombres', 'Apellidos', 'Total Estudiantes Asignados', 'Total Aprobados', 'Porcentaje Tasa Aprobación %'];
            case 'materia-reprobados':
            case 'estadisticas-materia':
                return ['Materia', 'Total Alumnos', 'Total Reprobados', 'Tasa Reprobación %', 'Promedio Nota'];
            case 'postulantes-concurrentes':
                return ['CI', 'Nombres', 'Apellidos', 'Correo Electrónico', 'Teléfono', 'Postulaciones Realizadas', 'Gestiones Registradas'];
            case 'general-postulantes':
                return ['CI', 'Nombres', 'Apellidos', 'Correo Electrónico', 'Teléfono', 'Fecha Registro', 'Carrera Opción 1', 'Carrera Opción 2', 'Monto Pago', 'Estado Pago'];
            case 'postulantes-aprobados':
                return ['CI', 'Postulante (Nombre Completo)', 'Matemáticas', 'Física', 'Computación', 'Inglés', 'Promedio Final', 'Grupo Asignado', 'Carrera de Admisión'];
            case 'postulantes-reprobados':
                return ['CI', 'Postulante (Nombre Completo)', 'Matemáticas', 'Física', 'Computación', 'Inglés', 'Promedio Final', 'Grupo Asignado'];
            case 'promedios-generales':
                return ['Promedio Matemáticas', 'Promedio Física', 'Promedio Computación', 'Promedio Inglés', 'Promedio General Final', 'Total Postulantes Evaluados'];
            case 'grupos-habilitados':
                return ['ID Grupo', 'Nombre Grupo', 'Capacidad Máxima', 'Turno Horario', 'Total Alumnos Inscritos'];
            case 'docentes-grupo':
                return ['Nombre Grupo', 'Gestión', 'CI Docente', 'Docente Asignado', 'Materia Impartida'];
            case 'grupos-aprobados':
                return ['ID Grupo', 'Nombre Grupo', 'Total Alumnos', 'Alumnos Aprobados', 'Tasa Aprobación %'];
            default:
                return ['Datos'];
        }
    }
}
