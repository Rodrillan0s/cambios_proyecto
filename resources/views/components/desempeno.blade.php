<!DOCTYPE html>
<html>
<head>
    <title>Desempeño Final</title>
    <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid black; padding: 6px; font-size: 12px; }
        th { background: #eee; }
    </style>
</head>
<body>

<h3>Reporte de Desempeño Final</h3>

<table>
    <thead>
        <tr>
            <th>CI</th>
            <th>Postulante</th>
            <th>Mat</th>
            <th>Fis</th>
            <th>Comp</th>
            <th>Ing</th>
            <th>Final</th>
            <th>Estado</th>
            <th>Carrera</th>
        </tr>
    </thead>

    <tbody>
        @foreach($data as $d)
        <tr>
            <td>{{ $d->ci }}</td>
            <td>{{ $d->postulante }}</td>
            <td>{{ $d->promedio_matematicas }}</td>
            <td>{{ $d->promedio_fisica }}</td>
            <td>{{ $d->promedio_computacion }}</td>
            <td>{{ $d->promedio_ingles }}</td>
            <td>{{ $d->promedio_final }}</td>
            <td>{{ $d->aprobado ? 'APROBADO' : 'REPROBADO' }}</td>
            <td>{{ $d->carrera ?? '-' }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

</body>
</html>