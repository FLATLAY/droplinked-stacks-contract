import {
	Clarinet,
	Tx,
	Chain,
	Account,
	types,
} from 'https://deno.land/x/clarinet@v1.5.4/index.ts'
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts'
import { uintValue } from './utils/clarity.util.ts'

Clarinet.test({
	name: 'droplinked:create: should update the maps and return the correct result when creating a new SKU',
	fn(chain: Chain, accounts: Map<string, Account>) {
		const deployer = accounts.get('deployer')!
		const creator = accounts.get('wallet_1')!

		const droplinkedContract = deployer.address + '.droplinked-contract'
		const amount = 10000
		const price = 25
		const commission = 50
		const uri = 'ipfs://droplinked-sku'

		const block = chain.mineBlock([
			Tx.contractCall(
				droplinkedContract,
				'create',
				[
					types.uint(amount),
					types.uint(price),
					types.uint(commission),
					types.ascii(uri),
					types.principal(creator.address),
				],
				creator.address
			),
		])

		// droplinked:create should return ok response with sku id
		assertEquals(block.receipts[0].result, types.ok(types.uint(1)))

		const createdSkuIdResult = block.receipts[0].result.expectOk()
		const createdSkuId = uintValue(createdSkuIdResult)

		// droplinked:create should update commissions map
		const commissionResult = chain.callReadOnlyFn(
			droplinkedContract,
			'get-commission',
			[types.uint(createdSkuId), types.principal(creator.address)],
			creator.address
		).result
		assertEquals(commissionResult, types.ok(types.some(types.uint(commission))))

		// droplinked:create should update creators map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-creator',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectSome()
			.expectPrincipal(creator.address)

		// droplinked:create should update balances map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-balance',
				[types.uint(createdSkuId), types.principal(creator.address)],
				creator.address
			)
			.result.expectOk()
			.expectUint(amount)

		// droplinked:create should update prices map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-price',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectSome()
			.expectUint(price)

		// droplinked:create should update supplies map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-total-supply',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectUint(amount)

		// droplinked:craete should update uris map
		chain
			.callReadOnlyFn(
				droplinkedContract,
				'get-token-uri',
				[types.uint(createdSkuId)],
				creator.address
			)
			.result.expectOk()
			.expectSome()
			.expectAscii(uri)
	},
})
