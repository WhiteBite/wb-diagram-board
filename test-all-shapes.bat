@echo off
echo Testing all shape tools...
echo.
echo === RECTANGLE ===
npx playwright test rectangle.spec.ts --reporter=list | findstr /C:"passed" /C:"failed"
echo.
echo === ELLIPSE ===
npx playwright test ellipse.spec.ts --reporter=list | findstr /C:"passed" /C:"failed"
echo.
echo === DIAMOND ===
npx playwright test diamond.spec.ts --reporter=list | findstr /C:"passed" /C:"failed"
echo.
echo === TRIANGLE ===
npx playwright test triangle.spec.ts --reporter=list | findstr /C:"passed" /C:"failed"
echo.
echo === SUMMARY ===
npx playwright test rectangle.spec.ts ellipse.spec.ts diamond.spec.ts triangle.spec.ts --reporter=list | findstr /C:"passed" /C:"failed"
