<?php

namespace App\Http\Controllers;

use App\Services\CohortService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class CohortPaymentController extends Controller
{
    public function callback(Request $request, CohortService $cohorts)
    {
        $data = $request->validate(['reference' => 'required|string|max:100']);
        try {
            $result = $cohorts->complete($data['reference']);
        } catch (HttpExceptionInterface $error) {
            $result = ['enrolled' => false, 'message' => $error->getMessage()];
        } catch (ConnectionException $error) {
            $result = ['enrolled' => false, 'message' => 'Payment confirmation is temporarily unavailable. Return to the app or website and check payment again.'];
        }

        return Inertia::render('CohortPaymentResult', [...$result, 'reference' => $data['reference']]);
    }

    public function webhook(Request $request, CohortService $cohorts)
    {
        $key = config('services.paystack.secret_key');
        abort_unless($key && hash_equals(hash_hmac('sha512', $request->getContent(), $key), (string) $request->header('x-paystack-signature')), 401);
        $reference = $request->input('data.reference');
        if ($request->input('event') === 'charge.success' && is_string($reference) && DB::table('cohort_checkouts')->where('reference', $reference)->exists()) {
            $cohorts->complete($reference);
        }

        return response()->json(['received' => true]);
    }
}
